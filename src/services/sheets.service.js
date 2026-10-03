const { getSheetsClient } = require('../config/google');

async function appendToSheet(sheetId, row) {
  try {
    if (!sheetId) {
      throw new Error('Sheet ID missing');
    }

    if (!Array.isArray(row)) {
      throw new Error('Row must be an array');
    }

    console.log('Trying sheet:', sheetId);

    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Orders!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row]
      }
    });

    console.log('Sheet API response:', response.status);

    return true;

  } catch (error) {
    console.error(
      'Sheet Error:',
      error.message,
      error.response?.data || ''
    );

    return false;
  }
}

async function appendPaymentToSheet(sheetId, row) {
  try {
    if (!sheetId) {
      throw new Error('Sheet ID missing');
    }

    if (!Array.isArray(row)) {
      throw new Error('Payment row must be an array');
    }

    console.log('Saving payment to Payments sheet:', row);

    const sheets = getSheetsClient();

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Payments!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row]
      }
    });

    console.log(
      'Payment Sheet API response:',
      response.status
    );

    return true;

  } catch (error) {
    console.error(
      'Payment Sheet Error:',
      error.message,
      error.response?.data || ''
    );

    return false;
  }
}

module.exports = {
  appendToSheet,
  appendPaymentToSheet
};