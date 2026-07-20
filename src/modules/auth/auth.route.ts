import express from "express";
import { AuthControllers } from "./auth.controller";
import { AuthValidations } from "./auth.validation";
import validateRequest from "../../middlewares/validateRequest";
import { auth } from "../../middlewares/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Registers a new user. If role is TECHNICIAN, an empty TechnicianProfile is auto-created.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name (min 1 char)
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password (min 6 chars)
 *                 example: secret123
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, TECHNICIAN]
 *                 description: User role
 *                 example: CUSTOMER
 *           examples:
 *             customerRegistration:
 *               summary: Customer Registration Example
 *               value:
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *                 password: "secret123"
 *                 role: "CUSTOMER"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 201
 *               message: "User registered successfully"
 *               data:
 *                 id: "uuid"
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *                 role: "CUSTOMER"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
  "/register",
  validateRequest(AuthValidations.registerValidationSchema),
  AuthControllers.registerUser,
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and sets accessToken and refreshToken as HTTP-only cookies.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful. Sets HTTP-only cookies (accessToken, refreshToken).
 *         headers:
 *           Set-Cookie:
 *             description: accessToken and refreshToken cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User logged in successfully"
 *               data:
 *                 id: "uuid"
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *                 role: "CUSTOMER"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid password
 *       403:
 *         description: User is banned
 *       404:
 *         description: User not found
 */
router.post(
  "/login",
  validateRequest(AuthValidations.loginValidationSchema),
  AuthControllers.loginUser,
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Returns the currently authenticated user's profile based on the accessToken cookie.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *         description: JWT access token (HTTP-only)
 *     responses:
 *       200:
 *         description: Current user data retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "User profile retrieved successfully"
 *               data:
 *                 id: "uuid"
 *                 name: "John Doe"
 *                 email: "john@example.com"
 *                 role: "CUSTOMER"
 *       401:
 *         description: Unauthorized / Token missing or invalid
 *       404:
 *         description: User not found
 */
router.get("/me", auth("CUSTOMER", "TECHNICIAN", "ADMIN"), AuthControllers.getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clears the accessToken and refreshToken HTTP-only cookies.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *         description: JWT access token
 *     responses:
 *       200:
 *         description: Logout successful, cookies cleared
 *         headers:
 *           Set-Cookie:
 *             description: Cleared accessToken and refreshToken cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Logged out successfully"
 *               data: null
 */
router.post("/logout", auth("CUSTOMER", "TECHNICIAN", "ADMIN"), AuthControllers.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh token
 *     description: Issues a new access token and rotates the refresh token using the refreshToken cookie.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *         description: JWT refresh token (HTTP-only)
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New accessToken and refreshToken cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: "Access token refreshed successfully!"
 *               data:
 *                 refreshed: true
 *       401:
 *         description: Refresh token missing, invalid, or expired
 *       403:
 *         description: User is banned
 *       404:
 *         description: User not found
 */
router.post("/refresh", AuthControllers.refreshToken);

export const AuthRoutes = router;
