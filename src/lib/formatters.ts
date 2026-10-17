const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
};

function currencyPrefix(currency: string | null): string {
  if (!currency) return '$';
  const code = currency.toUpperCase();
  if (CURRENCY_SYMBOLS[code]) return CURRENCY_SYMBOLS[code];
  return `${code} `;
}

export function formatCurrency(amount: number | null, currency: string | null = 'USD'): string {
  if (amount === null || amount === undefined) {
    return 'Not disclosed';
  }

  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `${currencyPrefix(currency)}${val.toFixed(val % 1 === 0 ? 0 : 2)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `${currencyPrefix(currency)}${val.toFixed(val % 1 === 0 ? 0 : 1)}M`;
  }

  const code = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: /^[A-Z]{3}$/.test(code) ? code : 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString('en-US')}`;
  }
}

export function formatDealType(dealType: string): string {
  return dealType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
