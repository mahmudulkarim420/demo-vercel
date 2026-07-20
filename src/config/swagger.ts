import swaggerJsdoc from "swagger-jsdoc";
import config from "./index";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FixItNow API",
      version: "1.0.0",
      description: "API documentation for FixItNow",
    },
    servers: [
      {
        url: config.backendUrl || `http://localhost:${config.port}`,
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.route.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
