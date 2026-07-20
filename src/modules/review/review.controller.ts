import { Request, Response } from "express";
import { ReviewServices } from "./review.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.createReview(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    message: "Review created successfully!",
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
};
