function parseOrder(text) {
  if (!text || typeof text !== 'string') {
    return {
      qty: '1',
      item: ''
    };
  }

  const cleanedText = text.trim();

  const qtyMatch = cleanedText.match(/\d+/);
  const qty = qtyMatch ? qtyMatch[0] : '1';

  let item = cleanedText
    .replace(qtyMatch?.[0] || '', '')
    .replace(/\b(peti|petiya|bori|piece|pieces|pcs|kg|kilo)\b/gi, '')
    .trim();

  return {
    qty,
    item: item || cleanedText
  };
}

module.exports = {
  parseOrder
};