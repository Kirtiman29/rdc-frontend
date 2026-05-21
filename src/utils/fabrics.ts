import type { Design } from "@/types/product";

export type FabricUnit = "meter" | "swatch" | "quarter" | "yard";

type FabricPriceEntry = {
  unit: FabricUnit;
  label: string;
  priceCents: number;
  originalPriceCents?: number;
};

const fabricPriceConfig: Array<{
  unit: FabricUnit;
  label: string;
  finalKey:
    | "finalPricePerMeterCents"
    | "finalPricePerSwatchCents"
    | "finalPricePerQuarterCents"
    | "finalPricePerYardCents";
  originalKey:
    | "pricePerMeterCents"
    | "pricePerSwatchCents"
    | "pricePerQuarterCents"
    | "pricePerYardCents";
}> = [
  {
    unit: "meter",
    label: "Meter",
    finalKey: "finalPricePerMeterCents",
    originalKey: "pricePerMeterCents",
  },
  {
    unit: "swatch",
    label: "Swatch",
    finalKey: "finalPricePerSwatchCents",
    originalKey: "pricePerSwatchCents",
  },
  {
    unit: "quarter",
    label: "Quarter",
    finalKey: "finalPricePerQuarterCents",
    originalKey: "pricePerQuarterCents",
  },
  {
    unit: "yard",
    label: "Yard",
    finalKey: "finalPricePerYardCents",
    originalKey: "pricePerYardCents",
  },
];

export const getFabricPriceEntries = (product: Partial<Design>): FabricPriceEntry[] => {
  const entries: Array<FabricPriceEntry | null> = fabricPriceConfig.map(({ unit, label, finalKey, originalKey }) => {
      const originalPriceCents = product[originalKey];
      const finalPriceCents = product[finalKey] ?? originalPriceCents;

      if (typeof finalPriceCents !== "number") {
        return null;
      }

      return {
        unit,
        label,
        priceCents: finalPriceCents,
        originalPriceCents,
      };
    });

  return entries.filter((entry): entry is FabricPriceEntry => entry !== null);
};

export const hasFabricPricing = (product: Partial<Design>) =>
  getFabricPriceEntries(product).length > 0;

export const getFabricPrimaryPriceCents = (product: Partial<Design>) => {
  const entries = getFabricPriceEntries(product);
  return entries.find((entry) => entry.unit === "meter")?.priceCents
    ?? entries[0]?.priceCents
    ?? product.finalPriceCents
    ?? product.basePriceCents
    ?? 0;
};

export const getFabricPrimaryOriginalPriceCents = (product: Partial<Design>) => {
  const entries = getFabricPriceEntries(product);
  return entries.find((entry) => entry.unit === "meter")?.originalPriceCents
    ?? entries[0]?.originalPriceCents
    ?? product.basePriceCents;
};
