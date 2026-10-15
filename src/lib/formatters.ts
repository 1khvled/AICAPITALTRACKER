export function formatCurrency(amount: number | null, currency: string | null = 'USD'): string {
  if (amount === null || amount === undefined) {
    return 'Not disclosed';
  }

  if (amount >= 1_000_000_000) {
    const val = amount / 1_000_000_000;
    return `$${val.toFixed(val % 1 === 0 ? 0 : 2)}B`;
  }
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `$${val.toFixed(val % 1 === 0 ? 0 : 1)}M`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDealType(dealType: string): string {
  return dealType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
