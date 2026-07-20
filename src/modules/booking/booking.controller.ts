import { Request, Response } from "express";
import { BookingServices } from "./booking.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingServices.createBooking(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Booking created successfully!",
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await BookingServices.getAllBookings(
    req.user!.id,
    req.user!.role,
    req.query
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Bookings retrieved successfully!",
    meta,
    data,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingServices.getBookingById(
    req.params.id as string,
    req.user!.id,
    req.user!.role
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Booking retrieved successfully!",
    data: result,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingServices.cancelBooking(
    req.params.id as string,
    req.user!.id,
    req.body.reason
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Booking cancelled successfully!",
    data: result,
  });
});

export const BookingControllers = {
  createBooking,
  getAllBookings,
  getBookingById,
  cancelBooking,
};
