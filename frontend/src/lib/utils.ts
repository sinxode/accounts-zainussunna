/**
 * ZLS Financial Utilities
 * Standardizes currency formatting and balance calculations across the platform.
 */

export const formatCurrency = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '₹ 0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

export const formatCurrencyCompact = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '₹0';

  if (Math.abs(numericAmount) >= 10000000) {
    return `₹${(numericAmount / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(numericAmount) >= 100000) {
    return `₹${(numericAmount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(numericAmount) >= 1000) {
    return `₹${(numericAmount / 1000).toFixed(1)}K`;
  }

  return formatCurrency(numericAmount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(d);
};

/**
 * Normalizes user input for amount fields
 * Accepts: "500", "500.50", "1,000", "₹1,000"
 */
export const normalizeAmount = (input: string): number => {
  const clean = input.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatSmartPurpose = (template: string): string => {
  if (!template) return '';
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const yearName = now.getFullYear().toString();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return template
    .replace(/\{Month\}/gi, monthName)
    .replace(/\{Year\}/gi, yearName)
    .replace(/\{Date\}/gi, dateStr);
};

export const formatDisplayName = (name: string): string => {
  if (!name) return '';
  return name.replace(/^(Muhammed|Muhammad|Mohammed|Mohamed|Muhamad)\s+/i, '');
};
