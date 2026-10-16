import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type User = z.infer<typeof UserSchema>;
export const UserSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string().email(),
	age: z.number(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

// Input Validation for 'GET users' endpoint
export const UserListQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(50).default(10),
	sortBy: z.enum(["name", "age", "createdAt"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	name: z.string().optional(),
	minAge: z.coerce.number().int().nonnegative().optional(),
	maxAge: z.coerce.number().int().nonnegative().optional(),
});

export const GetUsersSchema = z.object({
	query: UserListQuerySchema,
});

export const PaginatedUsersSchema = z.object({
	data: z.array(UserSchema),
	page: z.number(),
	pageSize: z.number(),
	total: z.number(),
	totalPages: z.number(),
});

export type UserListQuery = z.infer<typeof UserListQuerySchema>;
export type PaginatedUsers = z.infer<typeof PaginatedUsersSchema>;
