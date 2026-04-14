import { publicApi } from './apiClient';
import type { Category, Design, DesignFilters, DesignsResponse } from '../types/product';

export interface FabricApiMedia {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'TIFF';
  role: 'COVER' | 'GALLERY';
}

export interface FabricApiResponse {
  id: number;
  fabricIdentifier?: string;
  title: string;
  description?: string;
  pricePerMeter?: number;
  stockMeters?: number;
  material?: string;
  width?: number | string;
  gsm?: number | string;
  length?: string;
  categoryId?: number;
  category?: Category;
  assetUuid?: string;
  coverAssetUuid?: string;
  media?: FabricApiMedia[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getNumberMeta = (data: unknown, key: string) => {
  if (!isRecord(data)) return undefined;
  return typeof data[key] === 'number' ? data[key] : undefined;
};

const getBooleanMeta = (data: unknown, key: string) => {
  if (!isRecord(data)) return undefined;
  return typeof data[key] === 'boolean' ? data[key] : undefined;
};

const unwrapResponse = (response: unknown): unknown => {
  if (!isRecord(response)) return response;

  const data = response.data;

  if (isRecord(data) && 'data' in data) {
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

const getCoverAsset = (fabric: FabricApiResponse) => {
  const coverMedia = fabric.media?.find((item) => item.role === 'COVER');
  return fabric.assetUuid || fabric.coverAssetUuid || coverMedia?.url || '';
};

export const mapFabricToDesign = (fabric: FabricApiResponse): Design => {
  const priceCents = toRupeeCents(fabric.pricePerMeter);
  const width = fabric.width ? `${fabric.width} Inches` : undefined;
  const gsm = fabric.gsm ? String(fabric.gsm) : undefined;

  return {
    id: fabric.id,
    title: fabric.title,
    description: fabric.description || '',
    slug: `fabric-${fabric.id}`,
    designIdentifier: fabric.fabricIdentifier || `FAB-${fabric.id}`,
    assetUuid: getCoverAsset(fabric),
    basePriceCents: priceCents,
    finalPriceCents: priceCents,
    discountPercent: 0,
    specialOffer: false,
    luxury: false,
    newArrival: false,
    trending: false,
    editorsPick: false,
    active: fabric.active ?? true,
    draft: false,
    imageFormat: fabric.length,
    imageType: fabric.material,
    repeatSize: width,
    resolution: gsm,
    designType: 'Fabric',
    category: fabric.category,
    categories: fabric.category ? [fabric.category] : [],
    tags: [],
    media: fabric.media || [],
    createdAt: fabric.createdAt || '',
    updatedAt: fabric.updatedAt,
  };
};

const buildFabricParams = (filters?: DesignFilters) => {
  const params = new URLSearchParams();

  if (!filters) return params;

  if (filters.page !== undefined) params.append('page', String(filters.page));
  if (filters.size !== undefined) params.append('size', String(filters.size));
  if (filters.categoryId !== undefined) params.append('categoryId', String(filters.categoryId));
  if (filters.search) params.append('search', filters.search);

  if (filters.sortBy?.startsWith('price,')) {
    params.append('sort', filters.sortBy.replace(/^price,/, 'pricePerMeter,'));
  } else if (filters.sortBy?.startsWith('createdAt,')) {
    params.append('sort', filters.sortBy);
  }

  return params;
};

const sortFabrics = (content: Design[], sortBy?: string) => {
  const sorted = [...content];

  if (sortBy === 'price,asc') {
    return sorted.sort((a, b) => a.finalPriceCents - b.finalPriceCents);
  }

  if (sortBy === 'price,desc') {
    return sorted.sort((a, b) => b.finalPriceCents - a.finalPriceCents);
  }

  if (sortBy === 'createdAt,desc') {
    return sorted.sort((a, b) => Date.parse(b.createdAt || '0') - Date.parse(a.createdAt || '0'));
  }

  return sorted;
};

export const getFabrics = async (filters?: DesignFilters): Promise<DesignsResponse> => {
  const response = await publicApi.get('/public/fabrics', {
    params: buildFabricParams(filters),
  });
  const data = unwrapResponse(response);
  const allContent = sortFabrics(extractFabricArray(data).map(mapFabricToDesign), filters?.sortBy);
  const isPagedResponse = isRecord(data) && Array.isArray(data.content);
  const page = filters?.page || 0;
  const size = filters?.size || allContent.length;
  const content = isPagedResponse || !size
    ? allContent
    : allContent.slice(page * size, page * size + size);
  const totalElements = getNumberMeta(data, 'totalElements') ?? allContent.length;
  const totalPages = getNumberMeta(data, 'totalPages') ?? (size ? Math.ceil(totalElements / size) : 1);

  return {
    content,
    totalElements,
    totalPages,
    size,
    number: getNumberMeta(data, 'number') ?? page,
    first: getBooleanMeta(data, 'first') ?? page === 0,
    last: getBooleanMeta(data, 'last') ?? page >= totalPages - 1,
    empty: getBooleanMeta(data, 'empty') ?? content.length === 0,
  };
};

export const getFabricById = async (id: string | number): Promise<Design> => {
  const response = await publicApi.get(`/public/fabrics/${id}`);
  return mapFabricToDesign(unwrapResponse(response) as FabricApiResponse);
};
