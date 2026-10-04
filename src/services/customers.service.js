const { getSheetsClient } = require('../config/google');

async function getCustomers(sheetId) {
  if (!sheetId) {
    throw new Error('Sheet ID missing');
  }

  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Customers!A:C'
  });

  const rows = response.data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  return rows.slice(1).map(row => ({
    phone: String(row[0] || '').trim(),
    name: String(row[1] || '').trim(),
    created_at: String(row[2] || '').trim()
  }));
}

async function findCustomerByPhone(sheetId, phone) {
  if (!sheetId || !phone) {
    return null;
  }

  const customers = await getCustomers(sheetId);

  const normalizedPhone = String(phone).trim();

  return (
    customers.find(
      customer => customer.phone === normalizedPhone
    ) || null
  );
}

async function addCustomer(sheetId, phone, name) {
  if (!sheetId) {
    throw new Error('Sheet ID missing');
  }

  if (!phone) {
    throw new Error('Customer phone is missing');
  }

  if (!name) {
    throw new Error('Customer name is missing');
  }

  const sheets = getSheetsClient();

  const row = [
    String(phone).trim(),
    String(name).trim(),
    new Date().toISOString()
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Customers!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row]
    }
  });

  return {
    phone: row[0],
    name: row[1],
    created_at: row[2]
  };
}

module.exports = {
  getCustomers,
  findCustomerByPhone,
  addCustomer
};