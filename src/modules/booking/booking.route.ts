import express from "express";
import { BookingControllers } from "./booking.controller";
import { BookingValidations } from "./booking.validation";
import validateRequest from "../../middlewares/validateRequest";
import validateParams from "../../middlewares/validateParams";
import { idParamValidationSchema, paginationQuerySchema } from "../../validations";
import { auth } from "../../middlewares/auth";
import validateQuery from "../../middlewares/validateQuery";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booking
 *   description: Booking operations
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking
 *     tags: [Booking]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - scheduledDate
 *               - timeSlot
 *               - contactNumber
 *             properties:
 *               serviceId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *               timeSlot:
 *                 type: string
 *               contactNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post(
  "/",
  auth("CUSTOMER"),
  validateRequest(BookingValidations.createBookingValidationSchema),
  BookingControllers.createBooking,
);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Booking]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get(
  "/",
  auth("CUSTOMER", "TECHNICIAN", "ADMIN"),
  validateQuery(paginationQuerySchema),
  BookingControllers.getAllBookings,
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Booking]
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
 *         description: Booking details
 */
router.get(
  "/:id",
  auth("CUSTOMER", "TECHNICIAN", "ADMIN"),
  validateParams(idParamValidationSchema),
  BookingControllers.getBookingById,
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     description: |
 *       Cancels a booking owned by the authenticated customer.
 *       Only the customer who created the booking may cancel it.
 *
 *       Business rules by booking/payment state:
 *       - ACCEPTED + payment PENDING: cancelled, no refund, payment stays PENDING.
 *       - PAID + payment COMPLETED: a Stripe refund is issued using the saved
 *         transactionId, booking becomes CANCELLED and payment becomes REFUNDED.
 *       - IN_PROGRESS: cannot be cancelled (400).
 *       - COMPLETED: cannot be cancelled (400).
 *       - CANCELLED: already cancelled (400).
 *     tags: [Booking]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the booking to cancel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation (stored on the booking).
 *           examples:
 *             cancelAccepted:
 *               summary: Cancel an ACCEPTED booking (no refund)
 *               value:
 *                 reason: "Booked by mistake"
 *             cancelPaid:
 *               summary: Cancel a PAID booking (triggers refund)
 *               value:
 *                 reason: "No longer needed"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Booking cancelled successfully!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: CANCELLED
 *                     cancellationReason:
 *                       type: string
 *                       example: "Booked by mistake"
 *                     payment:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: REFUNDED
 *             examples:
 *               cancelledNoRefund:
 *                 summary: Cancelled without refund (ACCEPTED + PENDING)
 *                 value:
 *                   success: true
 *                   message: "Booking cancelled successfully!"
 *                   data:
 *                     id: "b1f0c2a0-..."
 *                     status: CANCELLED
 *                     cancellationReason: "Booked by mistake"
 *                     payment:
 *                       status: PENDING
 *               cancelledWithRefund:
 *                 summary: Cancelled with refund (PAID + COMPLETED)
 *                 value:
 *                   success: true
 *                   message: "Booking cancelled successfully!"
 *                   data:
 *                     id: "b1f0c2a0-..."
 *                     status: CANCELLED
 *                     cancellationReason: "No longer needed"
 *                     payment:
 *                       status: REFUNDED
 *       400:
 *         description: Booking cannot be cancelled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 errorSources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       message:
 *                         type: string
 *             examples:
 *               inProgress:
 *                 summary: Service already started
 *                 value:
 *                   success: false
 *                   message: "Booking cannot be cancelled after the service has started."
 *                   errorSources:
 *                     - path: ""
 *                       message: "Booking cannot be cancelled after the service has started."
 *               completed:
 *                 summary: Booking already completed
 *                 value:
 *                   success: false
 *                   message: "Completed bookings cannot be cancelled."
 *                   errorSources:
 *                     - path: ""
 *                       message: "Completed bookings cannot be cancelled."
 *               alreadyCancelled:
 *                 summary: Booking already cancelled
 *                 value:
 *                   success: false
 *                   message: "Booking has already been cancelled."
 *                   errorSources:
 *                     - path: ""
 *                       message: "Booking has already been cancelled."
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Authenticated user is not the booking owner.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to cancel this booking!"
 *                 errorSources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       message:
 *                         type: string
 *             examples:
 *               unauthorized:
 *                 summary: Not the booking owner
 *                 value:
 *                   success: false
 *                   message: "You are not authorized to cancel this booking!"
 *                   errorSources:
 *                     - path: ""
 *                       message: "You are not authorized to cancel this booking!"
 *       404:
 *         description: Booking not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Booking not found!"
 *                 errorSources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       message:
 *                         type: string
 *             examples:
 *               notFound:
 *                 summary: Booking does not exist
 *                 value:
 *                   success: false
 *                   message: "Booking not found!"
 *                   errorSources:
 *                     - path: ""
 *                       message: "Booking not found!"
 */
router.patch(
  "/:id/cancel",
  auth("CUSTOMER"),
  validateParams(idParamValidationSchema),
  validateRequest(BookingValidations.cancelBookingValidationSchema),
  BookingControllers.cancelBooking,
);

export const BookingRoutes = router;
