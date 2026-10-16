import { StatusCodes } from "http-status-codes";

import type { CreateUserInput, UpdateUserInput, User } from "@/api/user/userModel";
import { UserRepository } from "@/api/user/userRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class UserService {
	private userRepository: UserRepository;

	constructor(repository: UserRepository = new UserRepository()) {
		this.userRepository = repository;
	}

	// Retrieves all users from the database
	async findAll(): Promise<ServiceResponse<User[] | null>> {
		try {
			const users = await this.userRepository.findAllAsync();
			if (!users || users.length === 0) {
				return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<User[]>("Users found", users);
		} catch (ex) {
			const errorMessage = `Error finding all users: $${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving users.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves a single user by their ID
	async findById(id: number): Promise<ServiceResponse<User | null>> {
		try {
			const user = await this.userRepository.findByIdAsync(id);
			if (!user) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<User>("User found", user);
		} catch (ex) {
			const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	// Creates a new user
	async create(input: CreateUserInput): Promise<ServiceResponse<User | null>> {
		try {
			const existingUser = await this.userRepository.findByEmailAsync(input.email);
			if (existingUser) {
				return ServiceResponse.failure("Email already in use", null, StatusCodes.CONFLICT);
			}

			const user = await this.userRepository.createAsync({
				name: input.name.trim(),
				email: input.email,
				age: input.age,
			});
			return ServiceResponse.success<User>("User created", user, StatusCodes.CREATED);
		} catch (ex) {
			const errorMessage = `Error creating user: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure("An error occurred while creating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	// Updates an existing user by their ID
	async update(id: number, input: UpdateUserInput): Promise<ServiceResponse<User | null>> {
		try {
			const existingUser = await this.userRepository.findByIdAsync(id);
			if (!existingUser) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
			}

			if (input.email !== undefined) {
				const emailUser = await this.userRepository.findByEmailAsync(input.email);
				if (emailUser && emailUser.id !== id) {
					return ServiceResponse.failure("Email already in use", null, StatusCodes.CONFLICT);
				}
			}

			const updates: { name?: string; email?: string; age?: number } = {};
			if (input.name !== undefined) updates.name = input.name.trim();
			if (input.email !== undefined) updates.email = input.email;
			if (input.age !== undefined) updates.age = input.age;

			const user = await this.userRepository.updateAsync(id, updates);
			if (!user) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<User>("User updated", user);
		} catch (ex) {
			const errorMessage = `Error updating user with id ${id}:, ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}

export const userService = new UserService();
