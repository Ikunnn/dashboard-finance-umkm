// Poody catalog — sinkron dengan poody-finance-v2.html (biz_poody)
export const POODY_SIZES = {
  M: { label: 'M', price: 10000, hpp: 5100 },
  L: { label: 'L', price: 12000, hpp: 6100 },
} as const;

export const POODY_TOPPINGS = [
  { id: 'keju', label: 'Keju', price: 2000, hpp: 900 },
  { id: 'oreo crumb', label: 'Oreo Crumb', price: 2000, hpp: 900 },
  { id: 'red velvet crumb', label: 'Red Velvet Crumb', price: 3000, hpp: 1300 },
  { id: 'matcha crumb', label: 'Matcha Crumb', price: 3000, hpp: 1300 },
  { id: 'regal crumb', label: 'Regal Crumb', price: 3000, hpp: 1200 },
  { id: 'froot loops', label: 'Froot Loops', price: 3000, hpp: 1400 },
  { id: 'koko krunch', label: 'Koko Krunch', price: 3000, hpp: 1400 },
] as const;

export const POODY_RASA = [
  { id: 'chocolatte', nama: 'Chocolatte', emo: '🍫', desc: 'Coklat lumer premium', color: 'bg-amber-900' },
  { id: 'matcha', nama: 'Matcha', emo: '🍵', desc: 'Matcha Jepang asli', color: 'bg-emerald-600' },
  { id: 'mango', nama: 'Mango', emo: '🥭', desc: 'Mangga manis segar', color: 'bg-orange-400' },
  { id: 'strawberry', nama: 'Strawberry', emo: '🍓', desc: 'Stroberi asam manis', color: 'bg-rose-500' },
  { id: 'taro', nama: 'Taro', emo: '💜', desc: 'Taro creamy gurih', color: 'bg-violet-500' },
  { id: 'bubblemgum', nama: 'Bubblegum', emo: '🫧', desc: 'Bubblegum fun manis', color: 'bg-sky-400' },
] as const;
