import express from "express";
import { TechnicianControllers } from "./technician.controller";
import { TechnicianValidations } from "./technician.validation";
import validateRequest from "../../middlewares/validateRequest";
import validateParams from "../../middlewares/validateParams";
import { idParamValidationSchema, paginationQuerySchema } from "../../validations";
import { auth } from "../../middlewares/auth";
import validateQuery from "../../middlewares/validateQuery";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Technician
 *   description: Technician operations
 */

/**
 * @swagger
 * /api/technician/bookings:
 *   get:
 *     summary: Get technician's bookings
 *     tags: [Technician]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get(
  "/bookings",
  auth("TECHNICIAN"),
  validateQuery(paginationQuerySchema),
  TechnicianControllers.getTechnicianBookings,
);

/**
 * @swagger
 * /api/technician/bookings/{id}:
 *   patch:
 *     summary: Update booking status
 *     tags: [Technician]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Booking updated
 */
router.patch(
  "/bookings/:id",
  auth("TECHNICIAN"),
  validateParams(idParamValidationSchema),
  validateRequest(TechnicianValidations.updateBookingStatusValidationSchema),
  TechnicianControllers.updateBookingStatus,
);

/**
 * @swagger
 * /api/technician/profile:
 *   put:
 *     summary: Update technician profile
 *     tags: [Technician]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               experience:
 *                 type: number
 *               hourlyRate:
 *                 type: number
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/profile",
  auth("TECHNICIAN"),
  validateRequest(TechnicianValidations.updateProfileValidationSchema),
  TechnicianControllers.updateProfile,
);

/**
 * @swagger
 * /api/technician/availability:
 *   put:
 *     summary: Update availability
 *     description: Updates the technician's weekly availability. The availability object maps day names to arrays of time slots.
 *     tags: [Technician]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availability
 *             properties:
 *               availability:
 *                 type: object
 *                 description: Map of day names to arrays of available time slots
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: string
 *             example:
 *               availability:
 *                 monday: ["09:00-12:00", "14:00-18:00"]
 *                 tuesday: ["09:00-12:00", "14:00-18:00"]
 *                 wednesday: ["09:00-12:00"]
 *                 thursday: ["14:00-18:00"]
 *                 friday: ["09:00-12:00", "14:00-18:00"]
 *                 saturday: ["10:00-15:00"]
 *                 sunday: []
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Availability updated successfully!"
 *               data:
 *                 id: "uuid"
 *                 userId: "uuid"
 *                 availability:
 *                   monday: ["09:00-12:00", "14:00-18:00"]
 *                   tuesday: ["09:00-12:00", "14:00-18:00"]
 *                   wednesday: ["09:00-12:00"]
 *                   thursday: ["14:00-18:00"]
 *                   friday: ["09:00-12:00", "14:00-18:00"]
 *                   saturday: ["10:00-15:00"]
 *                   sunday: []
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized / Token missing or invalid
 *       404:
 *         description: Technician profile not found
 */
router.put(
  "/availability",
  auth("TECHNICIAN"),
  validateRequest(TechnicianValidations.updateAvailabilityValidationSchema),
  TechnicianControllers.updateAvailability,
);

const listingRouter = express.Router();

/**
 * @swagger
 * /api/services/technicians:
 *   get:
 *     summary: Get all technicians
 *     tags: [Technician]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of technicians
 */
listingRouter.get(
  "/",
  validateQuery(paginationQuerySchema),
  TechnicianControllers.getAllTechnicians,
);

/**
 * @swagger
 * /api/services/technicians/{id}:
 *   get:
 *     summary: Get technician by ID
 *     tags: [Technician]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Technician details
 */
listingRouter.get(
  "/:id",
  validateParams(idParamValidationSchema),
  TechnicianControllers.getTechnicianById,
);

export const TechnicianRoutes = router;
export const TechnicianListingRoutes = listingRouter;
