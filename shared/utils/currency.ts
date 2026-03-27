export const toPaise     = (inr: number) => Math.round(inr * 100);
export const fromPaise   = (paise: number) => paise / 100;
export const formatINR   = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
