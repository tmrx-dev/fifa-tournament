import { API_CONFIG } from '../config/apiConfig';

const AUTH_BASE_URL = API_CONFIG.AUTH_BASE_URL;

export interface GoogleAuthService {
  signIn: () => void;
  signOut: () => void;
}

const googleAuthService: GoogleAuthService = {
  signIn: () => {
    console.log('Initiating Google sign-in...');
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${AUTH_BASE_URL}/api/auth/login/google`;
  },

  signOut: () => {
    console.log('Signing out from Google...');
    // Redirect to backend logout endpoint
    window.location.href = `${AUTH_BASE_URL}/api/auth/logout`;
  }
};

export { googleAuthService };
export default googleAuthService;
