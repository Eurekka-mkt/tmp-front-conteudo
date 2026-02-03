const API_URL = `https://v2-ms-content-${import.meta.env.VITE_V2_URL_ID}-uc.a.run.app/graphql`;
// const API_URL = `http://127.0.0.1:5001/eurekka-staging/us-central1/ms-content-graphql`

export async function fetchGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}