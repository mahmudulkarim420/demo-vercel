import { Request, Response } from "express";
import { CategoryServices } from "./category.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";

const getAllCategoriesAdmin = catchAsync(async (_req: Request, res: Response) => {
  const result = await CategoryServices.getAllCategoriesAdmin();

  sendResponse(res, {
    statusCode: 200,
    message: "Categories retrieved successfully!",
    data: result,
  });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.createCategory(req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Category created successfully!",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.updateCategory(
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Category updated successfully!",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  await CategoryServices.deleteCategory(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Category deleted successfully!",
    data: null,
  });
});

export const CategoryControllers = {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
};
