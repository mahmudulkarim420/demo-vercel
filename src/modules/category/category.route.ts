import express from "express";
import { CategoryControllers } from "./category.controller";
import { CategoryValidations } from "./category.validation";
import validateRequest from "../../middlewares/validateRequest";
import validateParams from "../../middlewares/validateParams";
import { idParamValidationSchema, paginationQuerySchema } from "../../validations";
import { auth } from "../../middlewares/auth";
import validateQuery from "../../middlewares/validateQuery";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Category operations (Admin)
 */

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get(
  "/",
  auth("ADMIN"),
  validateQuery(paginationQuerySchema),
  CategoryControllers.getAllCategoriesAdmin,
);

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Create a category
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (min 1 char)
 *                 example: Plumbing
 *               description:
 *                 type: string
 *                 description: Category description (optional)
 *                 example: Plumbing repair and installation services
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
  "/",
  auth("ADMIN"),
  validateRequest(CategoryValidations.createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   patch:
 *     summary: Update a category
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (min 1 char)
 *                 example: Plumbing
 *               description:
 *                 type: string
 *                 description: Category description
 *                 example: Plumbing repair and installation services
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch(
  "/:id",
  auth("ADMIN"),
  validateParams(idParamValidationSchema),
  validateRequest(CategoryValidations.updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete(
  "/:id",
  auth("ADMIN"),
  validateParams(idParamValidationSchema),
  CategoryControllers.deleteCategory,
);

export const CategoryRoutes = router;
