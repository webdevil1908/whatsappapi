const { findByPhoneId } = require('../config/supabase');
const { appendToSheet } = require('../services/sheets.service');
const { parseOrder } = require('../services/parser.service');
exports.verify = (req,res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if(mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN){
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};
exports.receive = async (req,res) => {
  try{
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const phoneId = entry?.metadata?.phone_number_id;
    const message = entry?.messages?.[0];
    if(!message || !phoneId) return res.sendStatus(200);
    const client = findByPhoneId(phoneId);
    if(!client) return res.sendStatus(200);
    const customerPhone = message.from;
    const text = message.text?.body || message.type;
    const { qty, item } = parseOrder(text);
    const row = [new Date().toLocaleString('en-IN'), customerPhone, text, item, qty];
    await appendToSheet(client.google_sheet_id, row);
  }catch(e){ console.error(e.message); }
  res.sendStatus(200);
};