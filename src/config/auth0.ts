import type { Auth0ProviderOptions } from '@auth0/auth0-react';

export const auth0ProviderOptions: Auth0ProviderOptions = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  cacheLocation: "localstorage",
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: 'https://microservices',
  }
};