// Argentine provinces and shipping rate calculation utilities

export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type ArgentinaProvince = (typeof ARGENTINA_PROVINCES)[number];

export interface ShippingRate {
  label: string;
  cpMin: number;
  cpMax: number;
  cost: number;
}

export const DEFAULT_SHIPPING_RATES: ShippingRate[] = [
  { label: "AMBA", cpMin: 1000, cpMax: 1899, cost: 3000 },
  { label: "Centro", cpMin: 1900, cpMax: 2999, cost: 4000 },
  { label: "Interior", cpMin: 3000, cpMax: 5999, cost: 5000 },
  { label: "Sur / Norte lejano", cpMin: 6000, cpMax: 9999, cost: 6000 },
];

export function calculateShipping(
  postalCode: string,
  rates: ShippingRate[]
): number | null {
  const cp = parseInt(postalCode, 10);
  if (isNaN(cp)) return null;
  for (const rate of rates) {
    if (cp >= rate.cpMin && cp <= rate.cpMax) {
      return rate.cost;
    }
  }
  return null;
}
