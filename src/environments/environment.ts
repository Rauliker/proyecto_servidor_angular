export const environment = {
  apiUrl: typeof __API_URL__ === 'undefined' ? '/api/auth/login' : __API_URL__,
  registerApiUrl:
    typeof __REGISTER_API_URL__ === 'undefined' ? '/api/auth/register' : __REGISTER_API_URL__,
} as const;
