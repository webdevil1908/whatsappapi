const fs = require('fs');
const path = '/tmp/clients.json';
function getClients(){
  if(!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path,'utf8'));
}
function saveClients(data){
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
function findByPhoneId(phoneId){
  return getClients().find(c => c.waba_phone_id === phoneId);
}
module.exports = { getClients, saveClients, findByPhoneId };