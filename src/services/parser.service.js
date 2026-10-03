function parseOrder(text) {
  if (!text || typeof text !== 'string') {
    return {
      isOrder: false,
      items: []
    };
  }

  const cleanedText = text.trim();

  if (!cleanedText) {
    return {
      isOrder: false,
      items: []
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
      items: []
    };
  }

  // Split multiple orders by new line
  const lines = cleanedText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const items = [];

  for (const line of lines) {
    const qtyMatch = line.match(/^(\d+(?:\.\d+)?)/);

    let qty = '1';
    let remaining = line;

    if (qtyMatch) {
      qty = qtyMatch[1];
      remaining = line
        .slice(qtyMatch[0].length)
        .trim();
    }

    // Detect unit
    const unitMatch = remaining.match(
      /^(peti|petiya|bori|piece|pieces|pcs|kg|kilo|dozen|doz|packet|packets|pack)\b/i
    );

    const unit = unitMatch
      ? unitMatch[1].toLowerCase()
      : '';

    // Remove unit from item name
    if (unitMatch) {
      remaining = remaining
        .slice(unitMatch[0].length)
        .trim();
    }

    if (!remaining) {
      continue;
    }

    items.push({
      qty,
      unit,
      item: remaining
    });
  }

  if (items.length === 0) {
    return {
      isOrder: false,
      items: []
    };
  }

  return {
    isOrder: true,
    items
  };
}

module.exports = {
  parseOrder
};