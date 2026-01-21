export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: 'digital' | 'fabric' | 'custom' | 'ready-made';
  tags: string[];
  colors: string[];
  inStock: boolean;
  featured?: boolean;
  premium?: boolean;
  specifications?: {
    [key: string]: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
}

export type ProductFilter = {
  category?: string[];
  priceRange?: [number, number];
  colors?: string[];
  tags?: string[];
  inStock?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'name' | 'newest';
};
