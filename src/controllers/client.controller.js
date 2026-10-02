const { getClients, addClient } = require('../config/supabase');

exports.addClient = async (req, res) => {
  try {
    const {
      shop_name,
      waba_phone_id,
      google_sheet_id,
      owner_phone
    } = req.body;

    if (!shop_name || !waba_phone_id || !google_sheet_id || !owner_phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingClients = await getClients();

    const alreadyExists = existingClients.find(
      client => client.waba_phone_id === waba_phone_id
    );

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: 'This WABA Phone ID is already registered'
      });
    }

    const client = await addClient({
      shop_name: shop_name.trim(),
      waba_phone_id: waba_phone_id.trim(),
      google_sheet_id: google_sheet_id.trim(),
      owner_phone: owner_phone.trim(),
      plan_status: 'active',
      created_at: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: 'Client Added, Bot Live!',
      client
    });

  } catch (error) {
    console.error('Add client error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to add client'
    });
  }
};

exports.listClients = async (req, res) => {
  try {
    const clients = await getClients();

    return res.json(clients);

  } catch (error) {
    console.error('List clients error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to load clients'
    });
  }
};