import bcrypt from 'bcrypt';
import { unifiedResponse } from 'uni-response';

import { ERROR, SUCCESS } from '../../../constants/messages.js';
import { generateCrewToken } from '../../../middleware/crew-auth.middleware.js';
import { PersonRepository } from '../../person/repositories/person.repository.js';
import { CrewCredentialRepository } from '../repositories/crew-credential.repository.js';
import { CrewLoginInput, CrewRegisterInput } from '../types/crew.types.js';

const BCRYPT_SALT_ROUNDS = 10;

export class CrewAuthService {
  constructor(
    private crewCredentialRepository: CrewCredentialRepository,
    private personRepository: PersonRepository,
  ) {}

  /**
   * Self-register a crew member.
   *
   * Business rules:
   *  a. seafarercode not in persons → insert new person row + credential
   *  b. seafarercode in persons, no credential, name matches → claim profile
   *  c. seafarercode in persons, no credential, name mismatch → 400
   *  d. seafarercode in persons, credential already exists → 409
   */
  async register(input: CrewRegisterInput) {
    try {
      const existingPerson = await this.personRepository.findBySeafarerCode(input.seafarercode);

      let personId: string;

      if (!existingPerson) {
        // Case a: new seafarecode — create person row
        const newPerson = await this.personRepository.create({
          name: input.name,
          seafarercode: input.seafarercode,
        });
        personId = newPerson.id;
      } else {
        // Person exists — check for existing credential
        const existingCredential = await this.crewCredentialRepository.findByPersonId(
          existingPerson.id,
        );

        if (existingCredential) {
          // Case d: already registered
          return unifiedResponse(false, ERROR.CREW_ALREADY_REGISTERED);
        }

        // Case b / c: no credential yet — validate name
        const inputNameNormalized = input.name.trim().toLowerCase();
        const existingNameNormalized = existingPerson.name.trim().toLowerCase();

        if (inputNameNormalized !== existingNameNormalized) {
          // Case c: name mismatch
          return unifiedResponse(false, ERROR.CREW_DATA_MISMATCH);
        }

        // Case b: claim existing profile
        personId = existingPerson.id;
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
      await this.crewCredentialRepository.create({ personId, passwordHash });

      const token = generateCrewToken(personId);
      return unifiedResponse(true, SUCCESS.CREW_REGISTERED, { token, personId });
    } catch {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  async login(input: CrewLoginInput) {
    try {
      const person = await this.personRepository.findBySeafarerCode(input.seafarercode);
      if (!person) {
        return unifiedResponse(false, 'Invalid credentials');
      }

      const credential = await this.crewCredentialRepository.findByPersonId(person.id);
      if (!credential) {
        return unifiedResponse(false, 'Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(input.password, credential.passwordHash);
      if (!isPasswordValid) {
        return unifiedResponse(false, 'Invalid credentials');
      }

      const token = generateCrewToken(person.id);
      return unifiedResponse(true, SUCCESS.CREW_LOGIN_SUCCESSFUL, {
        token,
        person: { id: person.id, name: person.name, seafarercode: person.seafarercode },
      });
    } catch {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Admin resets a crew member's password.
   */
  async resetPassword(personId: string, newPassword: string) {
    try {
      const credential = await this.crewCredentialRepository.findByPersonId(personId);
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

      if (!credential) {
        await this.crewCredentialRepository.create({ personId, passwordHash });
      } else {
        await this.crewCredentialRepository.updatePassword(personId, passwordHash);
      }

      return unifiedResponse(true, SUCCESS.CREW_PASSWORD_RESET);
    } catch {
      return unifiedResponse(false, ERROR.INTERNAL_SERVER_ERROR);
    }
  }
}
