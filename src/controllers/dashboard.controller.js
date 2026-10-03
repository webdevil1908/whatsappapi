const crypto = require('crypto');

const {
  sendWhatsAppMessage
} = require('../services/whatsapp.service');

const {
  getOrders,
  getPayments
} = require('../services/sheets.service');

const {
  findByPhoneId
} = require('../config/supabase');


const activeSessions = new Set();


// =========================
// LOGIN
// =========================

exports.login = async (req, res) => {
  try {

    const password = String(
      req.body?.password || ''
    ).trim();

    const dashboardPassword = String(
      process.env.DASHBOARD_PASSWORD || ''
    ).trim();

    if (!dashboardPassword) {
      return res.status(500).json({
        success: false,
        message: 'DASHBOARD_PASSWORD is not configured'
      });
    }

    if (!password || password !== dashboardPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString('hex');

    activeSessions.add(token);

    return res.json({
      success: true,
      token
    });

  } catch (error) {

    console.error(
      'Dashboard Login Error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};


// =========================
// AUTHENTICATION
// =========================

function authenticate(req, res) {

  const authHeader =
    req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {

    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });

    return false;
  }

  const token =
    authHeader.slice(7).trim();

  if (
    !token ||
    !activeSessions.has(token)
  ) {

    res.status(401).json({
      success: false,
      message: 'Session expired. Please login again.'
    });

    return false;
  }

  return true;
}


// =========================
// SEND WHATSAPP
// =========================

exports.sendWhatsApp = async (req, res) => {
  try {

    if (!authenticate(req, res)) {
      return;
    }

    const phone = String(
      req.body?.phone || ''
    ).replace(/\D/g, '');

    const message = String(
      req.body?.message || ''
    ).trim();

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    console.log(
      'Dashboard sending WhatsApp:',
      {
        phone,
        message
      }
    );

    const sent =
      await sendWhatsAppMessage(
        phone,
        message
      );

    if (!sent) {
      return res.status(500).json({
        success: false,
        message:
          'WhatsApp message could not be sent'
      });
    }

    return res.json({
      success: true,
      message:
        'WhatsApp message sent successfully'
    });

  } catch (error) {

    console.error(
      'Dashboard WhatsApp Error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Message sending failed'
    });
  }
};


// =========================
// DASHBOARD STATS
// =========================

exports.getStats = async (req, res) => {
  try {

    if (!authenticate(req, res)) {
      return;
    }

    /*
      Dashboard ka actual Order Sheet
      WABA Phone Number ID se identify hoga.
    */

    const phoneId =
      process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!phoneId) {

      return res.status(500).json({
        success: false,
        message:
          'WHATSAPP_PHONE_NUMBER_ID is not configured'
      });

    }


    // Find client configuration

    const client =
      await findByPhoneId(phoneId);


    if (!client) {

      console.log(
        'Dashboard client not found for phone ID:',
        phoneId
      );

      return res.status(404).json({
        success: false,
        message:
          'Dashboard client configuration not found'
      });

    }


    // Actual Order Sheet ID

    const sheetId =
      client.google_sheet_id;


    if (!sheetId) {

      return res.status(500).json({
        success: false,
        message:
          'Client Google Sheet ID is missing'
      });

    }


    console.log(
      'Dashboard using Order Sheet:',
      sheetId
    );


    // Read actual Orders + Payments sheet

    const [
      orders,
      payments
    ] = await Promise.all([

      getOrders(sheetId),

      getPayments(sheetId)

    ]);


    // Today's date

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    // Today's orders

    const todaysOrders =
      orders.filter(row => {

        return String(
          row[0] || ''
        ).slice(0, 10) === today;

      });


    // Today's payments

    const todaysPayments =
      payments.filter(row => {

        return String(
          row[0] || ''
        ).slice(0, 10) === today;

      });


    return res.json({

      success: true,

      stats: {

        todayOrders:
          todaysOrders.length,

        todayPayments:
          todaysPayments.length,

        totalOrders:
          orders.length,

        totalPayments:
          payments.length

      },

      recentOrders:
        orders.slice(0, 10),

      recentPayments:
        payments.slice(0, 10)

    });


  } catch (error) {

    console.error(
      'Dashboard Stats Error:',
      error.message,
      error.stack
    );

    return res.status(500).json({
      success: false,
      message:
        'Dashboard data could not be loaded'
    });
  }
};


// =========================
// LOGOUT
// =========================

exports.logout = async (req, res) => {

  const authHeader =
    req.headers.authorization || '';

  if (
    authHeader.startsWith('Bearer ')
  ) {

    const token =
      authHeader.slice(7).trim();

    if (token) {
      activeSessions.delete(token);
    }

  }

  return res.json({
    success: true
  });

};