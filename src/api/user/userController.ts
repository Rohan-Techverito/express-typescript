import type { Request, RequestHandler, Response } from "express";

import { UserListQuerySchema } from "@/api/user/userModel";
import { userService } from "@/api/user/userService";

class UserController {
	public getUsers: RequestHandler = async (req: Request, res: Response) => {
		const query = UserListQuerySchema.parse(req.query);
		const serviceResponse = await userService.findAll(query);
		if (serviceResponse.success) {
			res.status(serviceResponse.statusCode).json(serviceResponse.responseObject);
		} else {
			res.status(serviceResponse.statusCode).send(serviceResponse);
		}
	};

	public getUser: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10);
		const serviceResponse = await userService.findById(id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const userController = new UserController();
