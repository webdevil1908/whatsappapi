const axios = require('axios');

async function sendWhatsAppMessage(to, message) {
  try {
    if (!to) {
      throw new Error('Recipient phone number missing');
    }

    if (!message) {
      throw new Error('Message missing');
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!phoneNumberId) {
      throw new Error('WHATSAPP_PHONE_NUMBER_ID is missing');
    }

    if (!accessToken) {
      throw new Error('META_ACCESS_TOKEN is missing');
    }

    const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('WhatsApp message sent:', response.data);

    return true;

  } catch (error) {
    console.error(
      'WhatsApp Send Error:',
      error.response?.data || error.message
    );

    return false;
  }
}

module.exports = {
  sendWhatsAppMessage
};