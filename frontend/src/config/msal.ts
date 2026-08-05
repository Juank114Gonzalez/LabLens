import { Configuration, PopupRequest, PublicClientApplication } from '@azure/msal-browser';
import { env } from './env';

export const msalConfig: Configuration = {
  auth: {
    clientId: env.NEXT_PUBLIC_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${env.NEXT_PUBLIC_MSAL_TENANT_ID}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : env.NEXT_PUBLIC_APP_URL,
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : env.NEXT_PUBLIC_APP_URL,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['User.Read'],
};

let msalInstance: PublicClientApplication | null = null;
let msalInitialized = false;

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }
  return msalInstance;
}

