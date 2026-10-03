function parseOrder(text) {
  if (!text || typeof text !== 'string') {
    return {
      isOrder: false,
      qty: '1',
      item: ''
    };
  }

  const cleanedText = text.trim();

  if (!cleanedText) {
    return {
      isOrder: false,
      qty: '1',
      item: ''
    };
  }

  const qtyMatch = cleanedText.match(/\d+/);
  const qty = qtyMatch ? qtyMatch[0] : '1';

  let item = cleanedText
    .replace(qtyMatch?.[0] || '', '')
    .replace(
      /\b(peti|petiya|bori|piece|pieces|pcs|kg|kilo)\b/gi,
      ''
    )
    .trim();

  if (!item) {
    return {
      isOrder: false,
      qty,
      item: ''
    };
  }

  // Common non-order messages
  const nonOrderMessages = [
    'hello',
    'hi',
    'hey',
    'hii',
    'good morning',
    'good afternoon',
    'good evening',
    'thanks',
    'thank you',
    'ok',
    'okay'
  ];

  if (nonOrderMessages.includes(cleanedText.toLowerCase())) {
    return {
      isOrder: false,
      qty: '1',
      item: ''
    };
  }

  return {
    isOrder: true,
    qty,
    item
  };
}

module.exports = {
  parseOrder
};