import { PublicClientApplication, type Configuration } from '@azure/msal-browser';

// Get the current environment
const isDevelopment = import.meta.env.DEV;
const frontendUrl = isDevelopment 
  ? 'http://localhost:5173'
  : 'https://victorious-pond-05d5a0403.6.azurestaticapps.net';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: '949a23e7-76fa-4513-9061-faee2a0d8de5', // Microsoft app registration client ID
    authority: 'https://login.microsoftonline.com/facf7706-1b6e-43b2-a3a0-1f1ca2a5270b',
    redirectUri: `${frontendUrl}/auth/callback`,
    postLogoutRedirectUri: frontendUrl,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Create the main MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Login request configuration
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
  prompt: 'select_account'
};
