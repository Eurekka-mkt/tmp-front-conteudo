export type AppTypeEnum = 'POP_UP' | 'BANNER' | 'BUTTON';

export interface AppDynamicContent {
  id: string;
  type: AppTypeEnum;
  active: boolean;
  link?: string;
  image?: string;
  description?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppDynamicContentInput {
  type: AppTypeEnum;
  active: boolean;
  link?: string;
  image?: string;
  description?: string;
  title?: string;
}
