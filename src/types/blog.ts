export interface BlogPost {
  id: string;
  date: string;
  date_gmt: string;
  slug: string;
  status: string;
  title: {
    rendered: string;
    protected: boolean;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  featured_media: {
    image: string;
  };
  meta: {
    custom_field: string;
  };
  categories: BlogCategory[];
  tags: BlogTag[];
  link: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface PostInput {
  featured_media?: {
    image: string;
  };
}

export interface PaginatedBlogPosts {
  data: BlogPost[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    currentPage: number;
    totalPages: number;
  };
}