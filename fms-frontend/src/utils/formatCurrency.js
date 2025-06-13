/**
 * Format a number as Indian Rupee currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  // Handle null or undefined values
  if (amount === null || amount === undefined) {
    return '₹0.00';
  }

  // Format as Indian Rupee
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format a large number in Indian format with abbreviations (K, L, Cr)
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol
 * @returns {string} Formatted abbreviated currency
 */
export const formatAbbreviatedCurrency = (amount, showSymbol = true) => {
  // Handle non-numeric inputs
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  const symbol = showSymbol ? '₹' : '';
  
  // Format based on value ranges (Indian system)
  if (Math.abs(numAmount) >= 10000000) {
    // Crores (1 Cr = 10,000,000)
    return `${symbol}${(numAmount / 10000000).toFixed(2)} Cr`;
  } else if (Math.abs(numAmount) >= 100000) {
    // Lakhs (1 L = 100,000)
    return `${symbol}${(numAmount / 100000).toFixed(2)} L`;
  } else if (Math.abs(numAmount) >= 1000) {
    // Thousands
    return `${symbol}${(numAmount / 1000).toFixed(2)}K`;
  } else {
    // Regular format for smaller numbers
    return `${symbol}${numAmount.toFixed(2)}`;
  }
};
