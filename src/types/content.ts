export interface Book {
  id: string;
  title: string;
  description: string;
  price: number;
  shippingPrice?: number;
  pages: number;
  code: string;
  salesLink: string;
  fileRef: string;
  cover: string;
  owned: boolean;
  physical?: boolean;
  stock?: number;
  singleSale?: boolean;
  orderBump?: OrderBump[];
  currency?: string;
  language?: string;
}

export interface OrderBump {
  type: string;
  data: string;
}

export interface OrderBumpInput {
  type: string;
  data: string;
}

export interface BookInput {
  title: string;
  description: string;
  price: number;
  shippingPrice?: number;
  pages: number;
  code: string;
  salesLink: string;
  fileRef: string;
  cover: string;
  physical?: boolean;
  stock?: number;
  singleSale?: boolean;
  orderBump?: OrderBumpInput[];
  currency?: string;
  language?: string;
}

export interface Banner {
  id: string;
  image: string;
  link: string;
  type: 'MODAL' | 'BOTTOM';
  active: boolean;
}

export interface BannerInput {
  image: string;
  link: string;
  type: 'MODAL' | 'BOTTOM';
  active?: boolean;
}

export interface News {
  id: string;
  createdAt: string;
  title: string;
  slug: string;
  type: 'CAROUSEL' | 'IMAGE' | 'VIDEO';
  images?: string[];
  image?: string;
  video?: string;
  scheduledFor?: Date;
}

export interface NewsInput {
  title: string;
  slug: string;
  type: 'CAROUSEL' | 'IMAGE' | 'VIDEO';
  images?: string[];
  image?: string;
  video?: string;
  scheduledFor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}