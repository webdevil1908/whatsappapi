const { findByPhoneId } = require('../config/supabase');
const { parseOrder } = require('../services/parser.service');
const { appendToSheet } = require('../services/sheets.service');
const { sendWhatsAppMessage } = require('../services/whatsapp.service');

// Prevent duplicate webhook processing while the server is running
const processedMessageIds = new Set();

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

    if (messageId && processedMessageIds.has(messageId)) {
      console.log('Duplicate message ignored:', messageId);
      return;
    }

    if (messageId) {
      processedMessageIds.add(messageId);
    }

    // Find client using WhatsApp Phone Number ID
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
      console.log('Empty text message, ignoring');
      return;
    }

    // Parse order
    const { isOrder, qty, item } = parseOrder(text);

    if (!isOrder) {
      console.log('Not an order, ignoring:', text);
      return;
    }

    // Prepare order row
    const row = [
      new Date().toISOString(),
      customerPhone,
      text,
      item || '',
      qty || ''
    ];

    console.log('SHEET ME DAAL RAHA:', row);

    // Save order to Google Sheet
    const success = await appendToSheet(sheetId, row);

    if (success) {
      console.log('Sheet success');

      // Send successful order confirmation
      const confirmationMessage =
        `✅ Order received!\n\n` +
        `${qty} × ${item}`;

      const messageSent = await sendWhatsAppMessage(
        customerPhone,
        confirmationMessage
      );

      if (messageSent) {
        console.log('Order confirmation sent');
      } else {
        console.log('Order confirmation failed');
      }

    } else {
      console.log('Sheet append failed');

      // Inform customer if order could not be saved
      const failureMessage =
        '⚠️ Order receive nahi ho paya. Please try again.';

      const messageSent = await sendWhatsAppMessage(
        customerPhone,
        failureMessage
      );

      if (messageSent) {
        console.log('Order failure message sent');
      } else {
        console.log('Order failure message failed');
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