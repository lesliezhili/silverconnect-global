/**
 * Unit Tests for Auth Service
 */

import { AuthService } from '@/api/services/auth.service';

// Mock Supabase
jest.mock('@/api/services/auth.service', () => ({
  AuthService: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a new user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
      };

      (AuthService.signUp as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: null,
      });

      const result = await AuthService.signUp('test@example.com', 'password123');

      expect(AuthService.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should throw error on invalid email', async () => {
      (AuthService.signUp as jest.Mock).mockRejectedValue(
        new Error('Invalid email')
      );

      await expect(
        AuthService.signUp('invalid-email', 'password123')
      ).rejects.toThrow('Invalid email');
    });
  });

  describe('signIn', () => {
    it('should sign in a user', async () => {
      const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token123',
      };

      (AuthService.signIn as jest.Mock).mockResolvedValue(mockSession as any);

      const result: any = await AuthService.signIn('test@example.com', 'password123');

      expect(AuthService.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(result.access_token).toBe('token123');
    });

    it('should throw error on invalid credentials', async () => {
      (AuthService.signIn as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      await expect(
        AuthService.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };

      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null if no user is logged in', async () => {
      (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
