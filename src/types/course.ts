export interface Course {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  title?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  lessons?: Lesson;
  price?: number;
  currency?: Currency;
  language?: Language;
  singleSale?: boolean;
  orderBump?: OrderBump[];
}

export interface OrderBump {
  type: string;
  data: string;
}

export interface OrderBumpInput {
  type: string;
  data: string;
}

export interface Lesson {
  withModules: boolean;
  lessons?: LessonItem[];
  modules?: Module[];
  id?: string;
}

export interface Module {
  title?: string;
  lessons?: LessonItem[];
}

export interface LessonItem {
  id?: string;
  title?: string;
  video?: string;
  description?: string;
  downloads?: LessonItemDownload[];
}

export interface LessonItemDownload {
  title?: string;
  file?: string;
  referenceLink?: string;
  size?: string;
  ext?: string;
}

export interface Pagination {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
}

export interface CoursePaginated {
  data: Course[];
  pageInfo: Pagination;
}

export enum Currency {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR'
}

export enum Language {
  PT_BR = 'PT_BR',
  ES = 'ES'
}

export interface CreateCourseInput {
  title: string;
  slug: string;
  published?: boolean;
  description?: string;
  thumbnailUrl?: string;
  lessons?: Lesson;
  productId?: string;
  price: number;
  currency: Currency;
  language?: Language;
  singleSale?: boolean;
  orderBump?: OrderBumpInput[];
}

export interface UpdateCourseInput {
  title?: string;
  slug?: string;
  description?: string;
  published?: boolean;
  thumbnailUrl?: string;
  lessons?: Lesson;
  productId?: string;
  price?: number;
  currency?: Currency;
  language?: Language;
  orderBump?: OrderBumpInput[];
}