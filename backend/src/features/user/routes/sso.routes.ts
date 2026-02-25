import { Router } from 'express';

import { PrismaService } from '@/config/prisma.config';
import { UserRepository } from '../repositories/user.repository';
import { SsoService } from '../services/sso.service';
import { SsoController } from '../controllers/sso.controller';

// Dependency injection
const prisma = PrismaService.getInstance().client;
const userRepository = new UserRepository(prisma);
const ssoService = new SsoService(userRepository);
const ssoController = new SsoController(ssoService);

const router = Router();

/**
 * Redirect browser → SSO Portal login.
 * The browser navigates here directly (full-page redirect).
 */
router.get('/initiate', ssoController.initiate);

/**
 * SSO Portal redirects back here after user authenticates.
 * Exchanges the code for a local JWT then redirects to the frontend.
 */
router.get('/callback', ssoController.callback);

export default router;
