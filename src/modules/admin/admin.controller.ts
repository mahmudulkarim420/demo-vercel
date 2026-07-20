import { Request, Response } from "express";
import { AdminServices } from "./admin.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await AdminServices.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: "Users retrieved successfully!",
    meta,
    data,
  });
});

const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.toggleUserStatus(
    req.params.id as string,
    req.body.status
  );

  sendResponse(res, {
    statusCode: 200,
    message: "User status updated successfully!",
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await AdminServices.getAllBookings(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: "Bookings retrieved successfully!",
    meta,
    data,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getBookingById(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Booking retrieved successfully!",
    data: result,
  });
});

const getAllPayments = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getAllPayments();

  sendResponse(res, {
    statusCode: 200,
    message: "Payments retrieved successfully!",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getPaymentById(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Payment retrieved successfully!",
    data: result,
  });
});

export const AdminControllers = {
  getAllUsers,
  toggleUserStatus,
  getAllBookings,
  getBookingById,
  getAllPayments,
  getPaymentById,
};
