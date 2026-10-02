function parseOrder(text){
  let qty = text.match(/\d+/)?.[0] || '1';
  let item = text.replace(qty,'').replace(/peti|bori|piece|kg/i,'').trim();
  return { qty, item: item || text };
}
module.exports = { parseOrder };