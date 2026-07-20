import { Request, Response } from "express";
import { TechnicianServices } from "./technician.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";

const getTechnicianBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianServices.getTechnicianBookings(req.user!.id);

  sendResponse(res, {
    statusCode: 200,
    message: "Technician bookings retrieved successfully!",
    data: result,
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianServices.updateBookingStatus(
    req.params.id as string,
    req.user!.id,
    req.body.status
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Booking status updated successfully!",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianServices.updateProfile(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    message: "Profile updated successfully!",
    data: result,
  });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianServices.updateAvailability(
    req.user!.id,
    req.body.availability
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Availability updated successfully!",
    data: result,
  });
});

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await TechnicianServices.getAllTechnicians(req.query);

  sendResponse(res, {
    statusCode: 200,
    message: "Technicians retrieved successfully!",
    meta,
    data,
  });
});

const getTechnicianById = catchAsync(async (req: Request, res: Response) => {
  const result = await TechnicianServices.getTechnicianById(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    message: "Technician retrieved successfully!",
    data: result,
  });
});

export const TechnicianControllers = {
  getTechnicianBookings,
  updateBookingStatus,
  updateProfile,
  updateAvailability,
  getAllTechnicians,
  getTechnicianById,
};
