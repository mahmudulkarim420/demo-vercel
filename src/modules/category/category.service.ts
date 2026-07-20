import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import type {
  TCreateCategoryPayload,
  TUpdateCategoryPayload,
} from "./category.validation";

const getAllCategoriesAdmin = async () => {
  const result = await prisma.category.findMany({
    include: { _count: { select: { services: true } } },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

const createCategory = async (payload: TCreateCategoryPayload) => {
  const existing = await prisma.category.findFirst({
    where: { name: payload.name },
  });

  if (existing) {
    throw new AppError(409, "Category with this name already exists!");
  }

  const result = await prisma.category.create({
    data: payload,
  });

  return result;
};

const updateCategory = async (
  categoryId: string,
  payload: TUpdateCategoryPayload
) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError(404, "Category not found!");
  }

  if (payload.name && payload.name !== category.name) {
    const existing = await prisma.category.findFirst({
      where: { name: payload.name },
    });

    if (existing) {
      throw new AppError(409, "Category with this name already exists!");
    }
  }

  const result = await prisma.category.update({
    where: { id: categoryId },
    data: payload,
    include: { _count: { select: { services: true } } },
  });

  return result;
};

const deleteCategory = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { services: true } } },
  });

  if (!category) {
    throw new AppError(404, "Category not found!");
  }

  if (category._count.services > 0) {
    throw new AppError(
      400,
      "Cannot delete a category that has services assigned to it!"
    );
  }

  const result = await prisma.category.delete({
    where: { id: categoryId },
  });

  return result;
};

export const CategoryServices = {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};
