import { StatusCodes } from "http-status-codes";
import request from "supertest";

import type { PaginatedUsers, User } from "@/api/user/userModel";
import { users } from "@/api/user/userRepository";
import type { ServiceResponse } from "@/common/models/serviceResponse";
import { app } from "@/server";

describe("User API Endpoints", () => {
	describe("GET /users", () => {
		it("should return a flat paginated list of users", async () => {
			// Act
			const response = await request(app).get("/users");
			const responseBody = response.body as PaginatedUsers;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK);
			expect(responseBody.data.length).toEqual(users.length);
			responseBody.data.forEach((user, index) => compareUsers(users[index] as User, user));
			expect(responseBody.page).toEqual(1);
			expect(responseBody.pageSize).toEqual(10);
			expect(responseBody.total).toEqual(users.length);
			expect(responseBody.totalPages).toEqual(1);
			expect(response.body).not.toHaveProperty("success");
			expect(response.body).not.toHaveProperty("message");
			expect(response.body).not.toHaveProperty("responseObject");
			expect(response.body).not.toHaveProperty("statusCode");
		});

		it("supports page and pageSize", async () => {
			// Act
			const response = await request(app).get("/users?page=1&pageSize=1");
			const responseBody = response.body as PaginatedUsers;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK);
			expect(responseBody.data.length).toEqual(1);
			compareUsers(users[0] as User, responseBody.data[0]);
			expect(responseBody.page).toEqual(1);
			expect(responseBody.pageSize).toEqual(1);
			expect(responseBody.total).toEqual(users.length);
			expect(responseBody.totalPages).toEqual(users.length);
		});

		it("filters by name case-insensitively", async () => {
			// Act
			const response = await request(app).get("/users?name=alice");
			const responseBody = response.body as PaginatedUsers;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK);
			expect(responseBody.total).toEqual(1);
			expect(responseBody.data.length).toEqual(1);
			compareUsers(users[0] as User, responseBody.data[0]);
		});

		it("filters by inclusive minAge and maxAge", async () => {
			// Act
			const response = await request(app).get("/users?minAge=21&maxAge=21");
			const responseBody = response.body as PaginatedUsers;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK);
			expect(responseBody.total).toEqual(1);
			expect(responseBody.data.length).toEqual(1);
			compareUsers(users[1] as User, responseBody.data[0]);
		});

		it("sorts by age descending", async () => {
			// Act
			const response = await request(app).get("/users?sortBy=age&sortOrder=desc");
			const responseBody = response.body as PaginatedUsers;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK);
			expect(responseBody.data.map((user) => user.id)).toEqual([1, 2]);
		});

		it("applies id ascending as the sort tiebreaker", async () => {
			// Arrange
			const originalLength = users.length;
			users.push({
				id: 3,
				name: "Bob",
				email: "bob@example.com",
				age: 21,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			try {
				// Act
				const response = await request(app).get("/users?sortBy=age&sortOrder=asc&pageSize=50");
				const responseBody = response.body as PaginatedUsers;

				// Assert
				expect(response.statusCode).toEqual(StatusCodes.OK);
				expect(responseBody.data.map((user) => user.id)).toEqual([2, 3, 1]);
			} finally {
				users.length = originalLength;
			}
		});

		it("returns an empty list for a page beyond the last one", async () => {
			// Act
			const response = await request(app).get("/users?page=99&pageSize=10");
			const responseBody = response.body as PaginatedUsers;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK);
			expect(responseBody.data).toEqual([]);
			expect(responseBody.page).toEqual(99);
			expect(responseBody.pageSize).toEqual(10);
			expect(responseBody.total).toEqual(users.length);
			expect(responseBody.totalPages).toEqual(1);
		});

		it("returns 400 for invalid page, pageSize, and sortBy", async () => {
			// Act & Assert
			const invalidPage = await request(app).get("/users?page=0");
			expect(invalidPage.statusCode).toEqual(StatusCodes.BAD_REQUEST);
			expect(invalidPage.body.message).toContain("Invalid input");

			const invalidPageSize = await request(app).get("/users?pageSize=51");
			expect(invalidPageSize.statusCode).toEqual(StatusCodes.BAD_REQUEST);
			expect(invalidPageSize.body.message).toContain("Invalid input");

			const invalidSortBy = await request(app).get("/users?sortBy=email");
			expect(invalidSortBy.statusCode).toEqual(StatusCodes.BAD_REQUEST);
			expect(invalidSortBy.body.message).toContain("Invalid input");
		});

		it("returns 400 when minAge is greater than maxAge", async () => {
			// Act
			const response = await request(app).get("/users?minAge=30&maxAge=20");

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
			expect(response.body.message).toBe("minAge cannot be greater than maxAge");
		});
	});

	describe("GET /users/:id", () => {
		it("should return a user for a valid ID", async () => {
			// Arrange
			const testId = 1;
			const expectedUser = users.find((user) => user.id === testId) as User;

			// Act
			const response = await request(app).get(`/users/${testId}`);
			const responseBody: ServiceResponse<User> = response.body;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.OK);
			expect(responseBody.success).toBeTruthy();
			expect(responseBody.message).toContain("User found");
			if (!expectedUser) throw new Error("Invalid test data: expectedUser is undefined");
			compareUsers(expectedUser, responseBody.responseObject);
		});

		it("should return a not found error for non-existent ID", async () => {
			// Arrange
			const testId = Number.MAX_SAFE_INTEGER;

			// Act
			const response = await request(app).get(`/users/${testId}`);
			const responseBody: ServiceResponse = response.body;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
			expect(responseBody.success).toBeFalsy();
			expect(responseBody.message).toContain("User not found");
			expect(responseBody.responseObject).toBeNull();
		});

		it("should return a bad request for invalid ID format", async () => {
			// Act
			const invalidInput = "abc";
			const response = await request(app).get(`/users/${invalidInput}`);
			const responseBody: ServiceResponse = response.body;

			// Assert
			expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
			expect(responseBody.success).toBeFalsy();
			expect(responseBody.message).toContain("Invalid input");
			expect(responseBody.responseObject).toBeNull();
		});
	});
});

function compareUsers(mockUser: User, responseUser: User) {
	if (!mockUser || !responseUser) {
		throw new Error("Invalid test data: mockUser or responseUser is undefined");
	}

	expect(responseUser.id).toEqual(mockUser.id);
	expect(responseUser.name).toEqual(mockUser.name);
	expect(responseUser.email).toEqual(mockUser.email);
	expect(responseUser.age).toEqual(mockUser.age);
	expect(new Date(responseUser.createdAt)).toEqual(mockUser.createdAt);
	expect(new Date(responseUser.updatedAt)).toEqual(mockUser.updatedAt);
}
