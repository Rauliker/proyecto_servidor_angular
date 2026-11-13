export const environment = {
  apiUrl: typeof __API_URL__ === 'undefined' ? '/api/auth/login' : __API_URL__,
} as const;
