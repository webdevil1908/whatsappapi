const { getSheetsClient } = require('./google');

const CLIENTS_SHEET_ID = process.env.SHEET_ID;
const CLIENTS_RANGE = 'Clients!A:G';

async function getClients() {
  if (!CLIENTS_SHEET_ID) {
    throw new Error('SHEET_ID is missing');
  }

  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: CLIENTS_SHEET_ID,
    range: CLIENTS_RANGE
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  return rows.slice(1).map(row => ({
    id: String(row[0] || '').trim(),
    shop_name: String(row[1] || '').trim(),
    waba_phone_id: String(row[2] || '').trim(),
    google_sheet_id: String(row[3] || '').trim(),
    owner_phone: String(row[4] || '').trim(),
    plan_status: String(row[5] || 'active').trim(),
    created_at: String(row[6] || '').trim()
  }));
}

async function findByPhoneId(phoneId) {
  if (!phoneId) {
    return null;
  }

  const clients = await getClients();

  const incomingPhoneId = String(phoneId).trim();

  console.log('Looking for WABA Phone ID:', incomingPhoneId);
  console.log(
    'Available WABA Phone IDs:',
    clients.map(client => client.waba_phone_id)
  );

  return (
    clients.find(
      client =>
        String(client.waba_phone_id).trim() === incomingPhoneId
    ) || null
  );
}

async function addClient(clientData) {
  if (!CLIENTS_SHEET_ID) {
    throw new Error('SHEET_ID is missing');
  }

  const sheets = getSheetsClient();

  const row = [
    clientData.id || Date.now().toString(),
    clientData.shop_name || '',
    clientData.waba_phone_id || '',
    clientData.google_sheet_id || '',
    clientData.owner_phone || '',
    clientData.plan_status || 'active',
    clientData.created_at || new Date().toISOString()
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: CLIENTS_SHEET_ID,
    range: CLIENTS_RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row]
    }
  });

  return clientData;
}

module.exports = {
  getClients,
  findByPhoneId,
  addClient
};