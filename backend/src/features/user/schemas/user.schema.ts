import { z } from 'zod';

// Error messages
const minLengthErrorMessage = 'Password must be at least 8 characters long';
const maxLengthErrorMessage = 'Password must not exceed 20 characters';
const uppercaseErrorMessage = 'Password must contain at least one uppercase letter';
const lowercaseErrorMessage = 'Password must contain at least one lowercase letter';
const numberErrorMessage = 'Password must contain at least one number';
const specialCharacterErrorMessage =
  'Password must contain at least one special character (!@#$%^&*)';
const passwordMismatchErrorMessage = 'Passwords do not match';

// Reusable password schema
const passwordSchema = z
  .string()
  .min(8, { message: minLengthErrorMessage })
  .max(20, { message: maxLengthErrorMessage })
  .refine(password => /[A-Z]/.test(password), {
    message: uppercaseErrorMessage,
  })
  .refine(password => /[a-z]/.test(password), {
    message: lowercaseErrorMessage,
  })
  .refine(password => /[0-9]/.test(password), { message: numberErrorMessage })
  .refine(password => /[!@#$%^&*]/.test(password), {
    message: specialCharacterErrorMessage,
  });

// Register schema
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .nonempty({ message: 'Username is required' }),
  password: passwordSchema,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().nonempty({ message: 'Username is required' }),
  password: z.string().nonempty({ message: 'Password is required' }),
});

// Update User schema
export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .optional(),
  password: passwordSchema.optional(),
});
