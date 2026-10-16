import type { User } from "@/api/user/userModel";

export const users: User[] = [
	{
		id: 1,
		name: "Alice",
		email: "alice@example.com",
		age: 42,
		createdAt: new Date(),
		updatedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
	},
	{
		id: 2,
		name: "Robert",
		email: "Robert@example.com",
		age: 21,
		createdAt: new Date(),
		updatedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
	},
];

export class UserRepository {
	async findAllAsync(): Promise<User[]> {
		return users;
	}

	async findByIdAsync(id: number): Promise<User | null> {
		return users.find((user) => user.id === id) || null;
	}

	async findByEmailAsync(email: string): Promise<User | null> {
		const normalizedEmail = email.toLowerCase();
		return users.find((user) => user.email.toLowerCase() === normalizedEmail) || null;
	}

	async createAsync(data: { name: string; email: string; age: number }): Promise<User> {
		const user: User = {
			id: Math.max(...users.map((u) => u.id)) + 1,
			name: data.name,
			email: data.email,
			age: data.age,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		users.push(user);
		return user;
	}

	async updateAsync(id: number, updates: { name?: string; email?: string; age?: number }): Promise<User | null> {
		const user = users.find((u) => u.id === id);
		if (!user) return null;

		if (updates.name !== undefined) user.name = updates.name;
		if (updates.email !== undefined) user.email = updates.email;
		if (updates.age !== undefined) user.age = updates.age;
		user.updatedAt = new Date();

		return user;
	}
}
