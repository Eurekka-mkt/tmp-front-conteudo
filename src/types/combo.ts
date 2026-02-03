export enum ComboStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR'
}

export interface CiProduct {
  value: number;
  locale: string;
}

export interface MedProduct {
  value: number;
}

export interface CiProductInput {
  value: number;
  locale: string;
}

export interface MedProductInput {
  value: number;
}

export interface OrderBump {
  type: string;
  data: string;
}

export interface OrderBumpInput {
  type: string;
  data: string;
}

export interface Combo {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ComboStatus;
  price: number;
  cover: string;
  singleSale: boolean;
  orderBump: OrderBump[];
  currency: Currency;
  language: string;
  bookIds: string[];
  books?: any[]; // Will be populated with Book objects from the API
  courseIds: string[];
  courses?: any[]; // Will be populated with Course objects from the API
  cis: CiProduct[];
  meds: MedProduct[];
}

export interface ComboInput {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ComboStatus;
  price: number;
  cover: string;
  singleSale: boolean;
  orderBump: OrderBumpInput[];
  currency: Currency;
  language: string;
  bookIds: string[];
  courseIds: string[];
  cis: CiProductInput[];
  meds: MedProductInput[];
}

export interface PaginatedCombos {
  data: Combo[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}