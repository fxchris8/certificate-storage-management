import { Router } from 'express';

import { PrismaService } from '../../../config/prisma.config';
import { auth } from '../../../middleware/auth.middleware';
import { validateRequest } from '../../../middleware/validation.middleware';
import { PersonController } from '../controllers/person.controller';
import { PersonRepository } from '../repositories/person.repository';
import { createPersonSchema, updatePersonSchema } from '../schemas/person.schema';
import { PersonService } from '../services/person.service';

// Dependency Injection
const prismaService = PrismaService.getInstance();
const prisma = prismaService.client;
const personRepository = new PersonRepository(prisma);
const personService = new PersonService(personRepository);
const personController = new PersonController(personService);

const router = Router();

// All routes are protected
router.get('/', auth, personController.getAllPersons);
router.get('/stats', auth, personController.getStats);
router.get('/:id', auth, personController.getPersonById);
router.post('/', auth, validateRequest(createPersonSchema), personController.createPerson);
router.put('/:id', auth, validateRequest(updatePersonSchema), personController.updatePerson);
router.delete('/:id', auth, personController.deletePerson);

export default router;
