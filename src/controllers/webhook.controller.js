const { findByPhoneId } = require('../config/supabase');
const { parseOrder } = require('../services/parser.service');

const {
  appendToSheet,
  appendPaymentToSheet
} = require('../services/sheets.service');

const {
  findCustomerByPhone,
  addCustomer
} = require('../services/customers.service');

const { sendWhatsAppMessage } = require('../services/whatsapp.service');

const processedMessageIds = new Set();

// Temporary state for customers who are currently registering their name
const pendingCustomerNames = new Set();

// Payment keywords
const paymentKeywords = [
  'payment',
  'paid',
  'paytm',
  'gpay',
  'google pay',
  'phonepe',
  'upi',
  'transaction',
  'txn',
  'utr',
  'transfer',
  'transferred',
  'payment done',
  'amount paid',
  'payment kar diya',
  'payment kar di',
  'payment kar diya hai',
  'payment kar di hai',
  'paise bhej diye',
  'paisa bhej diya',
  'payment bhej diya',
  'payment bhej di',
  'payment sent',
  'paid kar diya',
  'paid kar di'
];

function isPaymentMessage(text) {
  const lowerText = text.toLowerCase().trim();

  return paymentKeywords.some(keyword =>
    lowerText.includes(keyword)
  );
}

exports.verify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = (
    process.env.META_VERIFY_TOKEN ||
    process.env.VERIFY_TOKEN ||
    ''
  ).trim();

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('VERIFY SUCCESS');
    return res.status(200).send(challenge);
  }

  console.log('VERIFY FAILED - token mismatch');
  return res.sendStatus(403);
};

exports.receive = async (req, res) => {
  // Respond to Meta immediately
  res.sendStatus(200);

  try {
    console.log(
      'BODY:',
      JSON.stringify(req.body).slice(0, 1000)
    );

    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const phoneId = value?.metadata?.phone_number_id;
    const message = value?.messages?.[0];

    if (!message || !phoneId) {
      return;
    }

    // Only process text messages
    if (message.type !== 'text') {
      console.log(
        'Ignoring unsupported message type:',
        message.type
      );
      return;
    }

    // Duplicate message protection
    const messageId = message.id;

    if (
      messageId &&
      processedMessageIds.has(messageId)
    ) {
      console.log(
        'Duplicate message ignored:',
        messageId
      );
      return;
    }

    if (messageId) {
      processedMessageIds.add(messageId);
    }

    // Find client
    const client = await findByPhoneId(phoneId);

    const sheetId =
      client?.google_sheet_id ||
      process.env.TEST_SHEET_ID ||
      process.env.SHEET_ID;

    if (!sheetId) {
      console.log(
        'Sheet ID nahi mila, phoneId:',
        phoneId
      );
      return;
    }

    if (!client) {
      console.log(
        'Client nahi mila, fallback Sheet ID use kar raha hu:',
        sheetId
      );
    }

    const customerPhone = message.from;
    const text = message.text?.body?.trim();

    if (!text) {
      console.log(
        'Empty text message, ignoring'
      );
      return;
    }

    // ==========================================
    // CUSTOMER REGISTRATION
    // ==========================================

    let customer = null;

    try {
      customer = await findCustomerByPhone(
        sheetId,
        customerPhone
      );
    } catch (error) {
      console.error(
        'Customer lookup failed:',
        error.message
      );
    }

    // If this number is currently waiting for name
    if (pendingCustomerNames.has(customerPhone)) {
      try {
        const customerName = text.trim();

        if (customerName.length < 2) {
          await sendWhatsAppMessage(
            customerPhone,
            'Please apna valid naam bhejiye.'
          );
          return;
        }

        customer = await addCustomer(
          sheetId,
          customerPhone,
          customerName
        );

        pendingCustomerNames.delete(
          customerPhone
        );

        console.log(
          'New customer registered:',
          customer
        );

        await sendWhatsAppMessage(
          customerPhone,
          `✅ Thanks ${customer.name}!\n\nAapka number register ho gaya hai.\nAb apna order bhejiye.`
        );

        return;

      } catch (error) {
        console.error(
          'Customer registration failed:',
          error.message
        );

        pendingCustomerNames.delete(
          customerPhone
        );

        await sendWhatsAppMessage(
          customerPhone,
          '⚠️ Registration nahi ho paya. Please dobara try karein.'
        );

        return;
      }
    }

    // If customer is new, ask for name
    if (!customer) {
      pendingCustomerNames.add(customerPhone);

      console.log(
        'New customer detected:',
        customerPhone
      );

      await sendWhatsAppMessage(
        customerPhone,
        '👋 Welcome!\n\nPlease apna naam bhejiye.'
      );

      return;
    }

    console.log(
      'Existing customer:',
      customer.name,
      customerPhone
    );

    // ==========================================
    // PAYMENT CHECK
    // ==========================================

    console.log(
      'Checking payment message:',
      text
    );

    if (isPaymentMessage(text)) {
      console.log(
        'PAYMENT MESSAGE DETECTED:',
        text
      );

      const paymentRow = [
        new Date().toISOString(),
        customerPhone,
        text
      ];

      console.log(
        'PAYMENTS SHEET ME DAAL RAHA:',
        paymentRow
      );

      const paymentSaved =
        await appendPaymentToSheet(
          sheetId,
          paymentRow
        );

      if (paymentSaved) {
        console.log(
          'Payment saved successfully'
        );
      } else {
        console.log(
          'Payment save failed'
        );
      }

      // Do NOT process payment as order
      return;
    }

    // ==========================================
    // ORDER PARSING
    // ==========================================

    const {
      isOrder,
      items
    } = parseOrder(text);

    if (!isOrder || !items.length) {
      console.log(
        'Not an order, ignoring:',
        text
      );
      return;
    }

    console.log(
      'Parsed order items:',
      items
    );

    let allSaved = true;

    // Save every item as separate row
    for (const orderItem of items) {
      const row = [
        new Date().toISOString(),
        customerPhone,
        customer?.name || '',
        text,
        orderItem.item || '',
        orderItem.qty || ''
      ];

      console.log(
        'SHEET ME DAAL RAHA:',
        row
      );

      const success =
        await appendToSheet(
          sheetId,
          row
        );

      if (!success) {
        allSaved = false;

        console.log(
          'Sheet append failed for:',
          orderItem.item
        );
      }
    }

    // ==========================================
    // ORDER CONFIRMATION
    // ==========================================

    if (allSaved) {
      console.log(
        'All order items saved successfully'
      );

      const confirmationLines =
        items.map(
          orderItem =>
            `${orderItem.qty} × ${orderItem.item}`
        );

      const confirmationMessage =
        `✅ Order received!\n\n` +
        confirmationLines.join('\n');

      const messageSent =
        await sendWhatsAppMessage(
          customerPhone,
          confirmationMessage
        );

      if (messageSent) {
        console.log(
          'Order confirmation sent'
        );
      } else {
        console.log(
          'Order confirmation failed'
        );
      }

    } else {
      console.log(
        'One or more order items failed'
      );

      const failureMessage =
        '⚠️ Order receive nahi ho paya. Please try again.';

      const messageSent =
        await sendWhatsAppMessage(
          customerPhone,
          failureMessage
        );

      if (messageSent) {
        console.log(
          'Order failure message sent'
        );
      } else {
        console.log(
          'Order failure message failed'
        );
      }
    }

  } catch (error) {
    console.error(
      'ERROR in receive:',
      error.message,
      error.stack
    );
  }
};