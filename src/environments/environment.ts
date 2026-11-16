export const environment = {
  apiBaseUrl: typeof __API_BASE_URL__ === 'undefined' ? 'http://localhost:8080' : __API_BASE_URL__,
} as const;
