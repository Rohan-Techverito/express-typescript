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

// Input Validation for 'POST users' endpoint
export const CreateUserSchema = z.object({
	body: z.object({
		name: z.string().trim().min(2).max(50),
		email: z.string().email(),
		age: z.number().int().min(18).max(120),
	}),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>["body"];

// Input Validation for 'PATCH users/:id' endpoint
export const UpdateUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z
		.object({
			name: z.string().trim().min(2).max(50).optional(),
			email: z.string().email().optional(),
			age: z.number().int().min(18).max(120).optional(),
		})
		.refine((data) => data.name !== undefined || data.email !== undefined || data.age !== undefined, {
			message: "At least one of name, email, or age must be provided",
		}),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>["body"];
