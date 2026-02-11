import { NextFunction, Request, Response } from 'express';

import { PersonService } from '../services/person.service';
import { CreatePersonInput, UpdatePersonInput } from '../types/person.types';

export class PersonController {
  private personService: PersonService;

  constructor(personService: PersonService) {
    this.personService = personService;
  }

  getAllPersons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.personService.getAllPersons();
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  getPersonById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.personService.getPersonById(id);
      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      next(error);
    }
  };

  createPerson = async (
    req: Request<{}, {}, CreatePersonInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.personService.createPerson(req.body);
      res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  updatePerson = async (
    req: Request<{ id: string }, {}, UpdatePersonInput>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.personService.updatePerson(id, req.body);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  deletePerson = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.personService.deletePerson(id);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.personService.getStats();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
