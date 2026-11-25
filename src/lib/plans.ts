// Pricing source: Selar subscription pages inspected on 2026-11-25.
//   https://selar.com/47plan?currency=USD  -> "Every month ($47)"
//   https://selar.com/57plan?currency=USD  -> "Every month ($57)"
//   https://selar.com/97plan?currency=USD  -> "Every month ($97)"
// The pages publish ONLY the price and billing frequency. All three are titled "Subscription" and
// list no features, credits, limits or storage. Those fields are therefore null and rendered as
// "To be confirmed". Do not fill them in until the owner supplies the real package contents.
export type Plan = {
  key: string; name: string; priceUsd: number; interval: 'month'; checkoutUrl: string; recommended?: boolean;
  nameConfirmed: boolean; monthlyCredits: number | null; storageGb: number | null; projectLimit: number | null; exportQuality: string | null;
};
export const PLANS: Plan[] = [
  { key: 'plan_47', name: 'Plan 47', priceUsd: 47, interval: 'month', checkoutUrl: 'https://selar.com/47plan?currency=USD', nameConfirmed: false, monthlyCredits: null, storageGb: null, projectLimit: null, exportQuality: null },
  { key: 'plan_57', name: 'Plan 57', priceUsd: 57, interval: 'month', checkoutUrl: 'https://selar.com/57plan?currency=USD', nameConfirmed: false, recommended: true, monthlyCredits: null, storageGb: null, projectLimit: null, exportQuality: null },
  { key: 'plan_97', name: 'Plan 97', priceUsd: 97, interval: 'month', checkoutUrl: 'https://selar.com/97plan?currency=USD', nameConfirmed: false, monthlyCredits: null, storageGb: null, projectLimit: null, exportQuality: null },
];
export const getPlan = (key: string) => PLANS.find((p) => p.key === key);
