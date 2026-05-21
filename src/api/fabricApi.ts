import { publicApi } from "./apiClient";
import type { Category, Design, DesignFilters, DesignsResponse } from "../types/product";

export interface FabricApiMedia {
  url: string;
  type: "IMAGE" | "VIDEO" | "TIFF";
  role: "COVER" | "GALLERY";
}

export interface FabricApiResponse {
  id: number;
  slug?: string;
  fabricIdentifier?: string;
  title: string;
  description?: string;
  pricePerMeter?: number;
  pricePerSwatch?: number;
  pricePerQuarter?: number;
  pricePerYard?: number;
  finalPricePerMeter?: number;
  finalPricePerSwatch?: number;
  finalPricePerQuarter?: number;
  finalPricePerYard?: number;
  stockMeters?: number;
  stockQuantity?: number;
  material?: string;
  width?: number | string;
  gsm?: number | string;
  length?: string;
  categoryId?: number;
  category?: Category;
  discountPercent?: number;
  specialOffer?: boolean;
  assetUuid?: string;
  coverAssetUuid?: string;
  media?: FabricApiMedia[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapResponse = (response: unknown): unknown => {
  if (!isRecord(response)) return response;

  const data = response.data;

  if (isRecord(data) && "data" in data) {
    return data.data;
  }

  return data ?? response;
};

const extractFabricArray = (data: unknown): FabricApiResponse[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as FabricApiResponse[];
  if (!isRecord(data)) return [];

  if (Array.isArray(data.content)) {
    return data.content as FabricApiResponse[];
  }

  if (Array.isArray(data.fabrics)) {
    return data.fabrics as FabricApiResponse[];
  }

  return [];
};

const toRupeeCents = (amount?: number) => Math.round(Number(amount || 0) * 100);

const toOptionalRupeeCents = (amount?: number) =>
  typeof amount === "number" ? Math.round(amount * 100) : undefined;

const formatWidth = (width?: number | string) => {
  if (width === undefined || width === null || width === "") {
    return undefined;
  }

  return `${width} Inches`;
};

const getCoverAsset = (fabric: FabricApiResponse) => {
  const coverMedia = fabric.media?.find((item) => item.role === "COVER");
  return fabric.assetUuid || fabric.coverAssetUuid || coverMedia?.url || "";
};

const getResolvedCategory = (
  fabric: FabricApiResponse,
  categoriesById?: Map<number, Category>
) => {
  if (fabric.category) {
    return fabric.category;
  }

  if (fabric.categoryId) {
    return categoriesById?.get(fabric.categoryId);
  }

  return undefined;
};

export const mapFabricToDesign = (
  fabric: FabricApiResponse,
  categoriesById?: Map<number, Category>
): Design => {
  const basePriceCents = toRupeeCents(fabric.pricePerMeter);
  const finalPriceCents = toRupeeCents(fabric.finalPricePerMeter ?? fabric.pricePerMeter);
  const resolvedCategory = getResolvedCategory(fabric, categoriesById);
  const discountPercent =
    fabric.discountPercent
    ?? (basePriceCents > finalPriceCents
      ? Math.round(((basePriceCents - finalPriceCents) / basePriceCents) * 100)
      : 0);

  return {
    id: fabric.id,
    title: fabric.title,
    description: fabric.description || "",
    slug: fabric.slug || `fabric-${fabric.id}`,
    designIdentifier: fabric.fabricIdentifier || `FAB-${fabric.id}`,
    assetUuid: getCoverAsset(fabric),
    basePriceCents,
    finalPriceCents,
    discountPercent,
    specialOffer: fabric.specialOffer ?? discountPercent > 0,
    luxury: false,
    newArrival: false,
    trending: false,
    editorsPick: false,
    active: fabric.active ?? true,
    draft: false,
    imageFormat: fabric.length,
    imageType: fabric.material,
    repeatSize: formatWidth(fabric.width),
    resolution: fabric.gsm ? String(fabric.gsm) : undefined,
    designType: "Fabric",
    categoryId: fabric.categoryId ?? resolvedCategory?.id,
    category: resolvedCategory,
    categories: resolvedCategory ? [resolvedCategory] : [],
    tags: [],
    media: fabric.media || [],
    pricePerMeterCents: toOptionalRupeeCents(fabric.pricePerMeter),
    pricePerSwatchCents: toOptionalRupeeCents(fabric.pricePerSwatch),
    pricePerQuarterCents: toOptionalRupeeCents(fabric.pricePerQuarter),
    pricePerYardCents: toOptionalRupeeCents(fabric.pricePerYard),
    finalPricePerMeterCents: toOptionalRupeeCents(fabric.finalPricePerMeter ?? fabric.pricePerMeter),
    finalPricePerSwatchCents: toOptionalRupeeCents(fabric.finalPricePerSwatch ?? fabric.pricePerSwatch),
    finalPricePerQuarterCents: toOptionalRupeeCents(fabric.finalPricePerQuarter ?? fabric.pricePerQuarter),
    finalPricePerYardCents: toOptionalRupeeCents(fabric.finalPricePerYard ?? fabric.pricePerYard),
    stockMeters: fabric.stockMeters,
    stockQuantity: fabric.stockQuantity,
    material: fabric.material,
    width: fabric.width,
    gsm: fabric.gsm,
    length: fabric.length,
    createdAt: fabric.createdAt || "",
    updatedAt: fabric.updatedAt,
  };
};

let fabricCategoriesPromise: Promise<Category[]> | null = null;

export const getFabricCategories = async (): Promise<Category[]> => {
  if (!fabricCategoriesPromise) {
    fabricCategoriesPromise = publicApi
      .get("/categories/public", {
        params: { scope: "FABRIC" },
      })
      .then((response) => {
        const data = unwrapResponse(response);
        return Array.isArray(data) ? (data as Category[]) : [];
      })
      .catch((error) => {
        fabricCategoriesPromise = null;
        console.error("Failed to load fabric categories:", error);
        return [];
      });
  }

  return fabricCategoriesPromise;
};

const getFabricCategoryMap = async () => {
  const categories = await getFabricCategories();
  return new Map(categories.map((category) => [category.id, category]));
};

const matchesSearch = (fabric: Design, search: string) => {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    fabric.title,
    fabric.description,
    fabric.designIdentifier,
    fabric.slug,
    fabric.material,
    fabric.category?.name,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));
};

const filterFabrics = (content: Design[], filters?: DesignFilters) => {
  if (!filters) {
    return content;
  }

  return content.filter((fabric) => {
    if (filters.categoryId !== undefined && fabric.categoryId !== filters.categoryId) {
      return false;
    }

    if (filters.specialOffer !== undefined && fabric.specialOffer !== filters.specialOffer) {
      return false;
    }

    if (filters.search && !matchesSearch(fabric, filters.search)) {
      return false;
    }

    return true;
  });
};

const sortFabrics = (content: Design[], sortBy?: string) => {
  const sorted = [...content];

  if (sortBy === "price,asc" || sortBy === "finalPriceCents,asc") {
    return sorted.sort((a, b) => a.finalPriceCents - b.finalPriceCents);
  }

  if (sortBy === "price,desc" || sortBy === "finalPriceCents,desc") {
    return sorted.sort((a, b) => b.finalPriceCents - a.finalPriceCents);
  }

  if (sortBy === "title,asc") {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortBy === "createdAt,desc") {
    return sorted.sort((a, b) => Date.parse(b.createdAt || "0") - Date.parse(a.createdAt || "0"));
  }

  return sorted;
};

export const getFabrics = async (filters?: DesignFilters): Promise<DesignsResponse> => {
  const [response, categoriesById] = await Promise.all([
    publicApi.get("/public/fabrics"),
    getFabricCategoryMap(),
  ]);

  const allContent = sortFabrics(
    filterFabrics(
      extractFabricArray(unwrapResponse(response)).map((fabric) => mapFabricToDesign(fabric, categoriesById)),
      filters
    ),
    filters?.sortBy
  );

  const page = filters?.page || 0;
  const size = filters?.size || allContent.length || 1;
  const start = page * size;
  const content = allContent.slice(start, start + size);
  const totalElements = allContent.length;
  const totalPages = size ? Math.ceil(totalElements / size) : 1;

  return {
    content,
    totalElements,
    totalPages,
    size,
    number: page,
    first: page === 0,
    last: page >= Math.max(totalPages - 1, 0),
    empty: content.length === 0,
  };
};

export const getFabricById = async (id: string | number): Promise<Design> => {
  const [response, categoriesById] = await Promise.all([
    publicApi.get(`/public/fabrics/${id}`),
    getFabricCategoryMap(),
  ]);
  return mapFabricToDesign(unwrapResponse(response) as FabricApiResponse, categoriesById);
};

export const getFabricBySlug = async (slug: string): Promise<Design> => {
  const [response, categoriesById] = await Promise.all([
    publicApi.get(`/public/fabrics/slug/${slug}`),
    getFabricCategoryMap(),
  ]);
  return mapFabricToDesign(unwrapResponse(response) as FabricApiResponse, categoriesById);
};

export const getFabricBySlugOrId = async (slugOrId: string): Promise<Design> => {
  try {
    return await getFabricBySlug(slugOrId);
  } catch (error) {
    if (/^\d+$/.test(slugOrId)) {
      return await getFabricById(slugOrId);
    }

    throw error;
  }
};
