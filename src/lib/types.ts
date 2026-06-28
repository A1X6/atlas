/** Client-safe DTO shapes returned by the API (no server-only imports). */

export type Role = "ADMIN" | "USER";
export type ProductStatus = "PUBLISHED" | "DRAFT" | "OUT_OF_STOCK";

export type EmailDTO = { id: string; address: string; isPrimary: boolean; verified: boolean };
export type PhoneDTO = { id: string; countryCode: string; number: string; isPrimary: boolean; verified: boolean };

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  emails: EmailDTO[];
  phones: PhoneDTO[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  price: string;
  currency: string;
  category: string;
  status: ProductStatus;
  imageUrl: string | null;
  sku: string | null;
  stock: number;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
