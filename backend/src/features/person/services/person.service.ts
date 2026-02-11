import { unifiedResponse } from 'uni-response';

import { SUCCESS, ERROR } from '../../../constants/messages';
import { PersonRepository } from '../repositories/person.repository';
import { CreatePersonInput, UpdatePersonInput } from '../types/person.types';

export class PersonService {
  constructor(private readonly personRepository: PersonRepository) {}

  async getAllPersons() {
    const persons = await this.personRepository.findAll();
    return unifiedResponse(true, SUCCESS.PERSON_FOUND, persons);
  }

  async getPersonById(id: string) {
    const person = await this.personRepository.findById(id);
    if (!person) {
      return unifiedResponse(false, ERROR.PERSON_NOT_FOUND);
    }
    return unifiedResponse(true, SUCCESS.PERSON_FOUND, person);
  }

  async createPerson(data: CreatePersonInput) {
    const person = await this.personRepository.create(data);
    return unifiedResponse(true, SUCCESS.PERSON_CREATED, person);
  }

  async updatePerson(id: string, data: UpdatePersonInput) {
    const existing = await this.personRepository.findById(id);
    if (!existing) {
      return unifiedResponse(false, ERROR.PERSON_NOT_FOUND);
    }

    try {
      const updated = await this.personRepository.update(id, data);
      return unifiedResponse(true, SUCCESS.PERSON_UPDATED, updated);
    } catch (error) {
      return unifiedResponse(false, 'Failed to update person');
    }
  }

  async deletePerson(id: string) {
    const existing = await this.personRepository.findById(id);
    if (!existing) {
      return unifiedResponse(false, ERROR.PERSON_NOT_FOUND);
    }

    try {
      await this.personRepository.delete(id);
      return unifiedResponse(true, SUCCESS.PERSON_DELETED);
    } catch (error) {
      return unifiedResponse(false, 'Failed to delete person');
    }
  }

  async getStats() {
    const stats = await this.personRepository.getStats();
    return unifiedResponse(true, 'Stats retrieved', stats);
  }
}
