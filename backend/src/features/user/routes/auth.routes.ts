import { PrismaService } from "@/config/prisma.config";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";
import { Router } from "express";
import { validateRequest } from "@/middleware/validation.middleware";
import { loginSchema } from "../schemas/user.schema";

// Dependency Injection
const prismaService = PrismaService.getInstance();
const prisma = prismaService.client; // Get the PrismaClient instance
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = Router();

import { auth } from "@/middleware/auth.middleware";

router.post('/login', validateRequest(loginSchema), userController.login);
router.get('/me', auth, userController.getProfile);

export default router;
