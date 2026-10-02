const { getClients, saveClients } = require('../config/supabase');
exports.addClient = (req,res) => {
  const { shop_name, waba_phone_id, google_sheet_id, owner_phone } = req.body;
  const clients = getClients();
  clients.push({ id: Date.now().toString(), shop_name, waba_phone_id, google_sheet_id, owner_phone, plan_status: 'active', created_at: new Date().toISOString() });
  saveClients(clients);
  res.json({ success: true, message: 'Client Added, Bot Live!' });
};
exports.listClients = (req,res) => { res.json(getClients()); };