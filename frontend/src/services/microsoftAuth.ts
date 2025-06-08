import type { LoginResponse } from './authApi';
import { API_CONFIG } from '../config/apiConfig';

const API_BASE_URL = API_CONFIG.BASE_URL;
const AUTH_BASE_URL = API_CONFIG.AUTH_BASE_URL;

export interface MicrosoftAuthService {
  signInWithMicrosoft: () => void;
  handleCallback: (token: string) => Promise<LoginResponse>;
  signOut: () => Promise<void>;
}

export const microsoftAuthService: MicrosoftAuthService = {
  signInWithMicrosoft: (): void => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${AUTH_BASE_URL}/api/auth/login/microsoft`;
  },

  handleCallback: async (token: string): Promise<LoginResponse> => {
    try {
      // Exchange the token received from the backend callback
      const response = await fetch(`${API_BASE_URL}/auth/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }

      const data = await response.json();
      return {
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      // Sign out from backend
      await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Redirect to Microsoft sign out
      window.location.href = `${AUTH_BASE_URL}/api/auth/signout-microsoft`;
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still clear local storage even if backend call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw error;
    }
  },
};
