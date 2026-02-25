import bcrypt from 'bcrypt';
import { unifiedResponse } from 'uni-response';

import { ERROR, SUCCESS } from '../../../constants/messages';
import { generateToken } from '../../../utils/generate-token.util';
import { UserRepository } from '../repositories/user.repository';
import { LoginInputTypes, RegisterInputTypes, UpdateUserInputTypes } from '../types/user.types';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async heartbeat() {
    return unifiedResponse(true, 'Ok, From user service');
  }

  async getAllUsers(params?: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const { data, total } = await this.userRepository.findAllUsers({ skip, take: limit, search });

    return unifiedResponse(true, SUCCESS.USER_FOUND, {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  }

  async login(loginInputObj: LoginInputTypes) {
    const { username, password } = loginInputObj;
    const user = await this.userRepository.findUserByUsername(username);

    if (!user) {
      return unifiedResponse(false, ERROR.USER_NOT_FOUND);
    }

    // SSO-only users have no passwordHash — reject password login immediately.
    if (!user.passwordHash) {
      return unifiedResponse(false, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return unifiedResponse(false, 'Invalid credentials');
    }

    const token = generateToken(user.id, 'user');
    return unifiedResponse(true, SUCCESS.LOGIN_SUCCESSFUL, { token, user: { id: user.id, username: user.username } });
  }

  async register(registerInputObj: RegisterInputTypes) {
    const { username, password } = registerInputObj;

    const existingUser = await this.userRepository.findUserByUsername(username);
    if (existingUser) {
      return unifiedResponse(false, 'Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.userRepository.createUser({
      username,
      passwordHash: hashedPassword,
    });

    const token = generateToken(newUser.id, 'user');
    return unifiedResponse(true, SUCCESS.REGISTRATION_SUCCESSFUL, { token, user: newUser });
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      return unifiedResponse(false, ERROR.USER_NOT_FOUND);
    }
    return unifiedResponse(true, SUCCESS.USER_FOUND, user);
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      return unifiedResponse(false, ERROR.USER_NOT_FOUND);
    }
    return unifiedResponse(true, SUCCESS.USER_FOUND, user);
  }

  async updateUser(userId: string, data: UpdateUserInputTypes) {
    const updateData: { username?: string; passwordHash?: string } = {};

    if (data.username) {
      const existingUser = await this.userRepository.findUserByUsername(data.username);
      if (existingUser && existingUser.id !== userId) {
        return unifiedResponse(false, 'Username already taken');
      }
      updateData.username = data.username;
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    try {
      const updatedUser = await this.userRepository.updateUser(userId, updateData);
      return unifiedResponse(true, 'User updated successfully', updatedUser);
    } catch (error) {
      return unifiedResponse(false, 'Failed to update user');
    }
  }

  async deleteUser(userId: string) {
    try {
      await this.userRepository.deleteUser(userId);
      return unifiedResponse(true, 'User deleted successfully');
    } catch (error) {
      return unifiedResponse(false, 'Failed to delete user');
    }
  }
}
