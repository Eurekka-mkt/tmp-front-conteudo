// Re-export types from other files for convenience
import type { Course } from './course';
import type { Book } from './content';
import type { Combo } from './combo';

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  paid: boolean;
  paidAt: boolean;
  hasPhysicalItem: boolean;
  sended: boolean;
  sendedAt: boolean;
  email: string;
  name?: string;
  cpf?: string;
  phone?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  bookIds: string[];
  books: Book[];
  courseIds: string[];
  courses: Course[];
  comboIds: string[];
  combos: Combo[];
}

export interface UpdateOrderInput {
  sended: boolean;
}

export interface PaginatedOrders {
  data: Order[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}