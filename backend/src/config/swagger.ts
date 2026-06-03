import swaggerJsdoc from "swagger-jsdoc";
import "dotenv/config";

// Get port from environment variable, default to 3000 if not set
const PORT = process.env.PORT ?? "3000";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Log the Swagger server URL for debugging
console.log(`[Swagger] Server URL configured: ${BASE_URL}/back-api`);

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mesob E-service  System API",
      version: "1.0.0",
      description: "API documentation for the Mesob E-service  System",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `${BASE_URL}/back-api`,
        description: "Development server",
      },
      {
        url: "http://72.60.81.253:4000/back-api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token obtained from /back-api/auth/login",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in cookie",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error type",
              example: "ValidationError",
            },
            message: {
              type: "string",
              description: "Error message",
              example: "Invalid request data",
            },
            details: {
              type: "array",
              items: {
                type: "object",
              },
              description: "Additional error details",
            },
          },
        },
        Office: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["ACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            username: { type: "string" },
            phone: { type: "string" },
            email: { type: "string", nullable: true },
            gender: { type: "string", enum: ["MALE", "FEMALE", "OTHER"] },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "PENDING", "BLOCKED"],
            },
            userType: { type: "string", enum: ["SUPER_ADMIN", "OFFICE_USER"] },
            officeId: { type: "string", nullable: true },
            roleId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            role: { $ref: "#/components/schemas/Role" },
            office: { $ref: "#/components/schemas/Office" },
          },
        },
        Role: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            roleType: {
              type: "string",
              enum: ["SUPER_ADMIN_ROLE", "OFFICE_ROLE"],
            },
            systemRole: {
              type: "string",
              enum: ["admin", "manager", "staff", "customer"],
              nullable: true,
            },
            officeId: { type: "string", nullable: true },
          },
        },
        Permission: {
          type: "object",
          properties: {
            id: { type: "string" },
            code: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
          },
        },
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            action: { type: "string" },
            entityType: { type: "string" },
            entityId: { type: "string", nullable: true },
            details: { type: "object", nullable: true },
            ipAddress: { type: "string", nullable: true },
            userAgent: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Folder: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            parentId: { type: "string", nullable: true },
            officeId: { type: "string" },
            createdById: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        File: {
          type: "object",
          properties: {
            id: { type: "string" },
            fileNumber: { type: "string" },
            firstName: { type: "string" },
            fatherName: { type: "string" },
            lastName: { type: "string" },
            fan: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            officeId: { type: "string" },
            folderId: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
        PaginationResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
              },
            },
            pagination: {
              type: "object",
              properties: {
                page: {
                  type: "integer",
                  example: 1,
                },
                pageSize: {
                  type: "integer",
                  example: 50,
                },
                totalItems: {
                  type: "integer",
                  example: 100,
                },
                totalPages: {
                  type: "integer",
                  example: 2,
                },
                hasNextPage: { type: "boolean" },
                hasPreviousPage: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication endpoints",
      },
      {
        name: "Files",
        description: "File management endpoints",
      },
      {
        name: "Folders",
        description: "Folder management endpoints",
      },
      {
        name: "Security",
        description: "Security and permissions endpoints",
      },
      {
        name: "Office",
        description: "Office management endpoints",
      },
      {
        name: "Staff",
        description: "Staff management endpoints",
      },
      {
        name: "Trash",
        description: "Trash management endpoints",
      },
      {
        name: "Tags",
        description: "Tag management endpoints",
      },
      {
        name: "Share",
        description: "File sharing endpoints",
      },
      {
        name: "Search",
        description: "Search endpoints",
      },
      {
        name: "Analytics",
        description: "Analytics endpoints",
      },
      {
        name: "Dashboard",
        description: "Dashboard statistics endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./dist/src/routes/*.js"], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
