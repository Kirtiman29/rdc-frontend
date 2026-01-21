import { Product, Category } from '@/types/product';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Digital Patterns',
    slug: 'digital',
    description: 'High-resolution seamless patterns for print and digital use',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    productCount: 24,
  },
  {
    id: '2',
    name: 'Premium Fabrics',
    slug: 'fabric',
    description: 'Luxurious fabrics crafted from the finest materials',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80',
    productCount: 18,
  },
  {
    id: '3',
    name: 'Custom Design Services',
    slug: 'custom',
    description: 'Bespoke textile design tailored to your vision',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&q=80',
    productCount: 6,
  },
  {
    id: '4',
    name: 'Ready-Made Collection',
    slug: 'ready-made',
    description: 'Curated pieces ready to elevate your space',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80',
    productCount: 12,
  },
];

export const products: Product[] = [
  // Digital Patterns
  {
    id: 'd1',
    name: 'Botanical Whispers',
    description: 'Delicate floral pattern inspired by English gardens. Perfect for home textiles and fashion prints.',
    price: 49,
    images: [
      'https://images.unsplash.com/photo-1534710961216-75c88202f43e?w=800&q=80',
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80',
    ],
    category: 'digital',
    tags: ['floral', 'botanical', 'elegant', 'seamless'],
    colors: ['sage', 'cream', 'blush'],
    inStock: true,
    featured: true,
    premium: true,
    specifications: {
      'File Format': 'PNG, AI, PSD',
      'Resolution': '300 DPI',
      'Dimensions': '12x12 inches',
      'License': 'Commercial Use',
    },
  },
  {
    id: 'd2',
    name: 'Geometric Luxe',
    description: 'Sophisticated geometric pattern with art deco influences. Ideal for upholstery and wallcoverings.',
    price: 59,
    images: [
      'https://images.unsplash.com/photo-1509537257950-20f875b03669?w=800&q=80',
    ],
    category: 'digital',
    tags: ['geometric', 'art-deco', 'modern', 'seamless'],
    colors: ['gold', 'navy', 'ivory'],
    inStock: true,
    premium: true,
    specifications: {
      'File Format': 'PNG, AI, PSD',
      'Resolution': '300 DPI',
      'Dimensions': '12x12 inches',
      'License': 'Commercial Use',
    },
  },
  {
    id: 'd3',
    name: 'Mediterranean Tiles',
    description: 'Hand-painted tile pattern inspired by coastal villas. Brings warmth to any surface.',
    price: 45,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    ],
    category: 'digital',
    tags: ['tile', 'mediterranean', 'coastal', 'seamless'],
    colors: ['terracotta', 'blue', 'white'],
    inStock: true,
    specifications: {
      'File Format': 'PNG, AI, PSD',
      'Resolution': '300 DPI',
      'Dimensions': '12x12 inches',
      'License': 'Commercial Use',
    },
  },
  // Premium Fabrics
  {
    id: 'f1',
    name: 'Silk Charmeuse - Midnight',
    description: 'Luxurious 19mm silk charmeuse in deep midnight blue. Perfect drape for evening wear.',
    price: 89,
    originalPrice: 110,
    images: [
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    ],
    category: 'fabric',
    tags: ['silk', 'luxury', 'evening-wear'],
    colors: ['midnight', 'navy'],
    inStock: true,
    featured: true,
    premium: true,
    specifications: {
      'Composition': '100% Mulberry Silk',
      'Weight': '19 momme',
      'Width': '45 inches',
      'Care': 'Dry Clean Only',
    },
  },
  {
    id: 'f2',
    name: 'Linen Blend - Natural',
    description: 'Breathable linen-cotton blend in natural ivory. Ideal for curtains and light upholstery.',
    price: 45,
    images: [
      'https://images.unsplash.com/photo-1528459105426-b9548367069b?w=800&q=80',
    ],
    category: 'fabric',
    tags: ['linen', 'natural', 'home-decor'],
    colors: ['natural', 'ivory', 'oatmeal'],
    inStock: true,
    specifications: {
      'Composition': '55% Linen, 45% Cotton',
      'Weight': 'Medium',
      'Width': '54 inches',
      'Care': 'Machine Washable',
    },
  },
  {
    id: 'f3',
    name: 'Velvet - Emerald Dream',
    description: 'Sumptuous cotton velvet in rich emerald. Makes a statement in any interior.',
    price: 75,
    images: [
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80',
    ],
    category: 'fabric',
    tags: ['velvet', 'luxury', 'upholstery'],
    colors: ['emerald', 'forest', 'green'],
    inStock: true,
    premium: true,
    specifications: {
      'Composition': '100% Cotton Velvet',
      'Weight': 'Heavy',
      'Width': '54 inches',
      'Care': 'Professional Clean',
    },
  },
  // Custom Services
  {
    id: 'c1',
    name: 'Bespoke Pattern Design',
    description: 'Work directly with our design team to create a unique pattern tailored to your brand.',
    price: 499,
    images: [
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80',
    ],
    category: 'custom',
    tags: ['bespoke', 'custom', 'consultation'],
    colors: [],
    inStock: true,
    featured: true,
    specifications: {
      'Includes': '3 Design Concepts',
      'Revisions': 'Unlimited',
      'Delivery': '2-3 Weeks',
      'Rights': 'Full Ownership',
    },
  },
  {
    id: 'c2',
    name: 'Collection Curation',
    description: 'Let us curate a complete textile collection for your interior design project.',
    price: 899,
    images: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
    ],
    category: 'custom',
    tags: ['curation', 'interior-design', 'consultation'],
    colors: [],
    inStock: true,
    premium: true,
    specifications: {
      'Includes': 'Full Collection Design',
      'Consultation': '2 Hours',
      'Delivery': '3-4 Weeks',
      'Samples': 'Included',
    },
  },
  // Ready-Made
  {
    id: 'r1',
    name: 'Artisan Throw Pillow Set',
    description: 'Set of two handcrafted throw pillows featuring our signature botanical print.',
    price: 189,
    originalPrice: 220,
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
    ],
    category: 'ready-made',
    tags: ['pillows', 'home-decor', 'handcrafted'],
    colors: ['sage', 'cream'],
    inStock: true,
    featured: true,
    premium: true,
    specifications: {
      'Size': '20x20 inches',
      'Fill': 'Down Alternative',
      'Cover': 'Removable, Linen Blend',
      'Set': '2 Pillows',
    },
  },
  {
    id: 'r2',
    name: 'Woven Table Runner',
    description: 'Hand-loomed table runner with subtle texture and elegant fringe detail.',
    price: 85,
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    ],
    category: 'ready-made',
    tags: ['table-runner', 'home-decor', 'woven'],
    colors: ['natural', 'taupe'],
    inStock: true,
    specifications: {
      'Size': '14x72 inches',
      'Material': 'Cotton-Linen Blend',
      'Care': 'Machine Washable',
      'Style': 'Fringed Ends',
    },
  },
  {
    id: 'r3',
    name: 'Cashmere Throw Blanket',
    description: 'Ultra-soft cashmere throw in a timeless herringbone pattern.',
    price: 395,
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    ],
    category: 'ready-made',
    tags: ['blanket', 'cashmere', 'luxury'],
    colors: ['oatmeal', 'charcoal'],
    inStock: true,
    premium: true,
    specifications: {
      'Size': '50x60 inches',
      'Material': '100% Cashmere',
      'Care': 'Dry Clean Only',
      'Pattern': 'Herringbone',
    },
  },
];

export const getFeaturedProducts = () => products.filter(p => p.featured);
export const getPremiumProducts = () => products.filter(p => p.premium);
export const getProductsByCategory = (category: string) => 
  products.filter(p => p.category === category);
export const getProductById = (id: string) => products.find(p => p.id === id);
