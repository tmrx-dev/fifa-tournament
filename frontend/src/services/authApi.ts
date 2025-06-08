import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type { User, CreateUserDto } from '../types';

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Authentication service with backend integration for user management
export const authService = {
  login: async (email: string, _password: string): Promise<LoginResponse> => {
    try {
      // Try to find existing user by email in the backend
      const response = await axios.get(`${API_BASE_URL}/users/email/${encodeURIComponent(email)}`);
      const existingUser = response.data;

      // Generate a mock JWT token for the existing user
      const mockToken = btoa(JSON.stringify({ 
        sub: existingUser.id, 
        email: existingUser.email,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      }));

      return {
        token: mockToken,
        user: existingUser
      };
    } catch (error: unknown) {
      const errorObj = error as { response?: { status?: number } };
      if (errorObj.response?.status === 404) {
        throw new Error('User not found. Please register first.');
      }
      throw new Error('Login failed. Please try again.');
    }
  },

  register: async (userData: CreateUserDto): Promise<LoginResponse> => {
    try {
      // Create user in the backend
      const response = await axios.post(`${API_BASE_URL}/users`, userData);
      const newUser = response.data;

      // Generate a mock JWT token for the new user
      const mockToken = btoa(JSON.stringify({ 
        sub: newUser.id, 
        email: newUser.email,
        exp: Date.now() + 24 * 60 * 60 * 1000
      }));

      return {
        token: mockToken,
        user: newUser
      };
    } catch (error: unknown) {
      const errorObj = error as { response?: { status?: number; data?: { message?: string } } };
      if (errorObj.response?.status === 400) {
        throw new Error(errorObj.response.data?.message || 'Registration failed. Please check your information.');
      }
      throw new Error('Registration failed. Please try again.');
    }
  },

  logout: async (): Promise<void> => {
    // Clear any server-side session if needed
    return Promise.resolve();
  },

  validateToken: async (token: string): Promise<User | null> => {
    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp && payload.exp < Date.now()) {
        return null; // Token expired
      }

      // Try to fetch the current user from the backend to ensure they still exist
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${payload.sub}`);
        return response.data;
      } catch (error: unknown) {
        const errorObj = error as { response?: { status?: number } };
        if (errorObj.response?.status === 404) {
          return null; // User no longer exists
        }
        // On other errors, fall back to token data
        return {
          id: payload.sub,
          email: payload.email,
          displayName: payload.email.split('@')[0],
          avatarUrl: '',
          createdAt: new Date().toISOString(),
        };
      }
    } catch {
      return null; // Invalid token
    }
  },
};
