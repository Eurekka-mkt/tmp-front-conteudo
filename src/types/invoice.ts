export interface InvoiceData {
  name: string;
  email: string;
  cpf: string;
  currency: string;
  value: number;
  createdAt: string;
  paidAt: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    zip: string;
    city: string;
    state: string;
  };
  title: string;
  books?: {
    id: string;
    title: string;
    currency: string;
    price: number;
    physical: boolean;
  }[];
  courses?: {
    id: string;
    title: string;
    currency: string;
    price: number;
  }[];
}

export interface PaginatedInvoiceData {
  data: InvoiceData[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}