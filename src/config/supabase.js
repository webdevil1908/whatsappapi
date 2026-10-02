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
    id: row[0] || '',
    shop_name: row[1] || '',
    waba_phone_id: row[2] || '',
    google_sheet_id: row[3] || '',
    owner_phone: row[4] || '',
    plan_status: row[5] || 'active',
    created_at: row[6] || ''
  }));
}

async function findByPhoneId(phoneId) {
  if (!phoneId) {
    return null;
  }

  const clients = await getClients();

  return (
    clients.find(
      client => client.waba_phone_id === phoneId
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