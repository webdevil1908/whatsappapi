const { getSheetsClient } = require('../config/google');
async function appendToSheet(sheetId, row){
  try{
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });
    return true;
  }catch(e){
    console.error('Sheet Error', e.message);
    return false;
  }
}
module.exports = { appendToSheet };