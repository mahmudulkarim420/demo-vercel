import express from "express";
import { ServiceControllers } from "./service.controller";
import { ServiceValidations } from "./service.validation";
import validateRequest from "../../middlewares/validateRequest";
import validateParams from "../../middlewares/validateParams";
import validateQuery from "../../middlewares/validateQuery";
import { idParamValidationSchema, paginationQuerySchema } from "../../validations";
import { auth } from "../../middlewares/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Service
 *   description: Service operations
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: Get all services
 *     tags: [Service]
 *     responses:
 *       200:
 *         description: List of services
 */
router.get("/", validateQuery(paginationQuerySchema), ServiceControllers.getAllServices);

/**
 * @swagger
 * /api/services/categories:
 *   get:
 *     summary: Get all service categories
 *     tags: [Service]
 *     responses:
 *       200:
 *         description: List of categories with counts
 */
router.get(
  "/categories",
  validateQuery(paginationQuerySchema),
  ServiceControllers.getAllCategories,
);

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Service]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details
 */
router.get("/:id", validateParams(idParamValidationSchema), ServiceControllers.getServiceById);

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a service
 *     tags: [Service]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - title
 *               - description
 *               - price
 *             properties:
 *               categoryId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Service created
 */
router.post(
  "/",
  auth("TECHNICIAN"),
  validateRequest(ServiceValidations.createServiceValidationSchema),
  ServiceControllers.createService,
);

/**
 * @swagger
 * /api/services/{id}:
 *   patch:
 *     summary: Update a service
 *     tags: [Service]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated
 */
router.patch(
  "/:id",
  auth("TECHNICIAN"),
  validateParams(idParamValidationSchema),
  validateRequest(ServiceValidations.updateServiceValidationSchema),
  ServiceControllers.updateService,
);

/**
 * @swagger
 * /api/services/{id}:
 *   delete:
 *     summary: Delete a service
 *     tags: [Service]
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
 *         description: Service deleted
 */
router.delete(
  "/:id",
  auth("TECHNICIAN"),
  validateParams(idParamValidationSchema),
  ServiceControllers.deleteService,
);

export const ServiceRoutes = router;
