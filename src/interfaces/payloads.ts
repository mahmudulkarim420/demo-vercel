import type { Role } from "../../generated/prisma/client";

export type PaginationQuery = {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type SortOrder = "asc" | "desc";

export type JwtPayload = {
  id: string;
  email: string;
  role: Role;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};
