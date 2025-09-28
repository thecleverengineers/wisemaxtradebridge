import { z } from 'zod';

// Authentication schemas
export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
});

export const signUpSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
  referralCode: z.string()
    .trim()
    .max(20, 'Referral code must be less than 20 characters')
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User profile schema
export const userProfileSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
});

// Investment schema
export const investmentSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  amount: z.number()
    .positive('Amount must be positive')
    .min(100, 'Minimum investment is $100')
    .max(1000000, 'Maximum investment is $1,000,000'),
});

// Withdrawal schema
export const withdrawalSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .min(10, 'Minimum withdrawal is $10'),
  currency: z.enum(['USDT', 'BTC', 'ETH']),
  walletAddress: z.string()
    .trim()
    .min(10, 'Invalid wallet address')
    .max(100, 'Wallet address too long'),
  network: z.string()
    .trim()
    .min(3, 'Network must be specified')
    .max(50, 'Network name too long'),
});

export type SignInData = z.infer<typeof signInSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type InvestmentData = z.infer<typeof investmentSchema>;
export type WithdrawalData = z.infer<typeof withdrawalSchema>;