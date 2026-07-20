import express from "express";
import { AuthRoutes } from "./modules/auth/auth.route";
import { ServiceRoutes } from "./modules/service/service.route";
import { BookingRoutes } from "./modules/booking/booking.route";
import { PaymentRoutes } from "./modules/payment/payment.route";
import { PaymentControllers } from "./modules/payment/payment.controller";
import { TechnicianRoutes, TechnicianListingRoutes } from "./modules/technician/technician.route";
import { ReviewRoutes } from "./modules/review/review.route";
import { AdminRoutes } from "./modules/admin/admin.route";
import { CategoryRoutes } from "./modules/category/category.route";
import AppError from "./utils/AppError";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import config from "./config";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      withCredentials: true,
    },
  }),
);

app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentControllers.stripeWebhook,
);

app.use(
  cors({
    origin: [config.frontendUrl, config.backendUrl].filter(Boolean),
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Database is connected" });
});

app.use("/api/auth", AuthRoutes);
app.use("/api/services/technicians", TechnicianListingRoutes);
app.use("/api/services", ServiceRoutes);
app.use("/api/bookings", BookingRoutes);
app.use("/api/payments", PaymentRoutes);
app.use("/api/technician", TechnicianRoutes);
app.use("/api/reviews", ReviewRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/admin/categories", CategoryRoutes);

app.use((req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
});

app.use(globalErrorHandler);

export default app;
