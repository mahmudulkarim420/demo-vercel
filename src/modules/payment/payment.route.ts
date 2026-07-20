import express from "express";
import { PaymentControllers } from "./payment.controller";
import { PaymentValidations } from "./payment.validation";
import validateRequest from "../../middlewares/validateRequest";
import validateParams from "../../middlewares/validateParams";
import { idParamValidationSchema, paginationQuerySchema } from "../../validations";
import { auth } from "../../middlewares/auth";
import validateQuery from "../../middlewares/validateQuery";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment operations via Stripe Checkout
 */

/**
 * @swagger
 * /api/payments/checkout:
 *   post:
 *     summary: Create a Stripe Checkout Session
 *     description: |
 *       Creates a Stripe Hosted Checkout Session for a booking and returns the
 *       Checkout URL the frontend should redirect the customer to.
 *       The booking must be in `ACCEPTED` status and not already paid.
 *       On successful payment, the Stripe webhook marks the booking as `PAID`.
 *     tags: [Payment]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: Stripe Checkout URL to redirect the customer to
 *                     sessionId:
 *                       type: string
 *                       description: Stripe Checkout Session ID
 *       400:
 *         description: Booking not accepted or already paid
 *       403:
 *         description: Not authorized to pay for this booking
 *       404:
 *         description: Booking not found
 */
router.post(
  "/checkout",
  auth("CUSTOMER"),
  validateRequest(PaymentValidations.createCheckoutSessionValidationSchema),
  PaymentControllers.createCheckoutSession,
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get payment history
 *     tags: [Payment]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get(
  "/",
  auth("CUSTOMER", "ADMIN"),
  validateQuery(paginationQuerySchema),
  PaymentControllers.getUserPaymentHistory,
);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payment]
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
 *         description: Payment details
 */
router.get(
  "/:id",
  auth("CUSTOMER", "ADMIN"),
  validateParams(idParamValidationSchema),
  PaymentControllers.getPaymentById,
);

export const PaymentRoutes = router;
