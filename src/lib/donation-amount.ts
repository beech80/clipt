// UI validation only. The payment endpoint remains authoritative.
export function donationAmountCents(value: string): number | null {
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents >= 100 && cents <= 50000 ? cents : null;
}
