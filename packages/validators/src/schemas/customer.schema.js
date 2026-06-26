import { z } from "zod";
import { addressSchema, objectIdSchema } from "../common.js";
import { CUSTOMER_TYPE } from "../constants/customer.constant.js";

export const customerSchema = z.object({ 
    customerType: z.enum(CUSTOMER_TYPE, { required_error: "Customer type is required", invalid_type_error: "Customer type must be either business or individual", }),
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
    phone: z.string().max(20, "Phone number cannot exceed 20 characters").refine((val) => val === "" || /^[0-9+\-\s()]+$/.test(val), { message: "Invalid phone number format", }).optional().or(z.literal("")),
    email: z.string().email("Invalid email address").max(100, "Email cannot exceed 100 characters").optional().or(z.literal("")),
    address: addressSchema.optional(),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional().or(z.literal("")),
  }).strict();

export const customerUpdateSchema = customerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const customerBulkUpdateSchema = z
.object({
    ids: z.array(objectIdSchema).min(1, "At least one customer ID is required"),
    data: customerUpdateSchema,
  })
.strict();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["name", "customerType", "phone", "email", "createdAt", "updatedAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  customerType: z.enum(CUSTOMER_TYPE).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const customerBulkDeleteSchema = z
.object({
    ids: z.array(objectIdSchema).min(1, "At least one customer ID is required"),
  })
.strict();
