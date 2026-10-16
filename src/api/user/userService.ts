import { StatusCodes } from "http-status-codes";

import type { PaginatedUsers, User, UserListQuery } from "@/api/user/userModel";
import { UserRepository } from "@/api/user/userRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class UserService {
	private userRepository: UserRepository;

	constructor(repository: UserRepository = new UserRepository()) {
		this.userRepository = repository;
	}

	// Retrieves a paginated, filtered, and sorted list of users
	async findAll(query: UserListQuery): Promise<ServiceResponse<PaginatedUsers | null>> {
		if (query.minAge !== undefined && query.maxAge !== undefined && query.minAge > query.maxAge) {
			return ServiceResponse.failure("minAge cannot be greater than maxAge", null, StatusCodes.BAD_REQUEST);
		}

		try {
			const { data, total } = await this.userRepository.findAllAsync(query);
			const totalPages = Math.ceil(total / query.pageSize);
			return ServiceResponse.success<PaginatedUsers>("Users found", {
				data,
				page: query.page,
				pageSize: query.pageSize,
				total,
				totalPages,
			});
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
}

export const userService = new UserService();
