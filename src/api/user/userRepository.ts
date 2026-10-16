import type { User, UserListQuery } from "@/api/user/userModel";

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
	async findAllAsync(query: UserListQuery): Promise<{ data: User[]; total: number }> {
		const filtered = users.filter((user) => {
			if (query.name !== undefined && !user.name.toLowerCase().includes(query.name.toLowerCase())) {
				return false;
			}
			if (query.minAge !== undefined && user.age < query.minAge) {
				return false;
			}
			if (query.maxAge !== undefined && user.age > query.maxAge) {
				return false;
			}
			return true;
		});

		if (query.sortBy !== undefined) {
			const direction = query.sortOrder === "desc" ? -1 : 1;
			filtered.sort((a, b) => {
				let comparison = 0;
				if (query.sortBy === "name") {
					comparison = a.name.localeCompare(b.name);
				} else if (query.sortBy === "age") {
					comparison = a.age - b.age;
				} else if (query.sortBy === "createdAt") {
					comparison = a.createdAt.getTime() - b.createdAt.getTime();
				}
				if (comparison !== 0) {
					return comparison * direction;
				}
				return a.id - b.id;
			});
		}

		const total = filtered.length;
		const startIndex = (query.page - 1) * query.pageSize;
		const data = filtered.slice(startIndex, startIndex + query.pageSize);

		return { data, total };
	}

	async findByIdAsync(id: number): Promise<User | null> {
		return users.find((user) => user.id === id) || null;
	}
}
