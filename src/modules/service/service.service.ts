import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { parsePagination, buildMeta } from "../../utils/pagination";
import { Prisma } from "../../../generated/prisma/client";
import type { PaginationQuery } from "../../interfaces/payloads";
import type { TCreateServicePayload, TUpdateServicePayload } from "./service.validation";

type ServiceQuery = PaginationQuery & {
  search?: string;
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
};

const getAllServices = async (query: ServiceQuery) => {
  const { page, limit, skip, take, sortBy, sortOrder } = parsePagination(query);
  const where: Prisma.ServiceWhereInput = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
    if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
  }

  const [data, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder } as Prisma.ServiceOrderByWithRelationInput,
      include: {
        category: true,
        technicianProfile: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.service.count({ where }),
  ]);

  return { data, meta: buildMeta(page, limit, total) };
};

const getServiceById = async (id: string) => {
  const result = await prisma.service.findUnique({
    where: { id },
    include: {
      category: true,
      technicianProfile: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!result) {
    throw new AppError(404, "Service not found!");
  }

  return result;
};

const createService = async (
  userId: string,
  payload: TCreateServicePayload
) => {
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile) {
    throw new AppError(404, "Technician profile not found!");
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(404, "Category not found!");
  }

  const result = await prisma.service.create({
    data: {
      title: payload.title,
      description: payload.description,
      price: payload.price,
      categoryId: payload.categoryId,
      technicianProfileId: technicianProfile.id,
    },
    include: {
      category: true,
      technicianProfile: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  return result;
};

const updateService = async (
  serviceId: string,
  userId: string,
  payload: TUpdateServicePayload
) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new AppError(404, "Service not found!");
  }

  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile || service.technicianProfileId !== technicianProfile.id) {
    throw new AppError(403, "You are not authorized to update this service!");
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new AppError(404, "Category not found!");
    }
  }

  const result = await prisma.service.update({
    where: { id: serviceId },
    data: payload,
    include: {
      category: true,
      technicianProfile: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  return result;
};

const deleteService = async (serviceId: string, userId: string) => {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new AppError(404, "Service not found!");
  }

  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });

  if (!technicianProfile || service.technicianProfileId !== technicianProfile.id) {
    throw new AppError(403, "You are not authorized to delete this service!");
  }

  const result = await prisma.service.delete({
    where: { id: serviceId },
  });

  return result;
};

const getAllCategories = async (query: { sortBy?: string }) => {
  let orderBy: Prisma.CategoryOrderByWithRelationInput = { createdAt: "desc" };

  if (query.sortBy === "name") {
    orderBy = { name: "asc" };
  } else if (query.sortBy === "createdAt") {
    orderBy = { createdAt: "desc" };
  }

  const result = await prisma.category.findMany({
    orderBy,
    include: {
      _count: { select: { services: true } },
    },
  });

  return result;
};

export const ServiceServices = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getAllCategories,
};
