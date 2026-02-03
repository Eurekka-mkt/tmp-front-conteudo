import { useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { fetchGraphQL } from '../lib/api';

export function useApi() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const query = useCallback(
    async <T = any>(
      query: string,
      variables?: Record<string, any>,
      requiresAuth: boolean = true
    ): Promise<T> => {
      if (!requiresAuth) {
        return fetchGraphQL<T>(query, variables);
      }

      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }

      const token = await getAccessTokenSilently();
      return fetchGraphQL<T>(query, variables, token);
    },
    [getAccessTokenSilently, isAuthenticated]
  );

  return { query };
}
