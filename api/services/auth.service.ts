import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Authentication Service
 * Handles user authentication and authorization
 */
export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(`Sign up failed: ${error.message}`);
    return data;
  }

  /**
   * Sign in user
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(`Sign in failed: ${error.message}`);
    return data;
  }

  /**
   * Sign out user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Sign out failed: ${error.message}`);
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw new Error(`Get user failed: ${error.message}`);
    return user;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw new Error(`Reset password failed: ${error.message}`);
    return data;
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(`Update password failed: ${error.message}`);
    return data;
  }
}
