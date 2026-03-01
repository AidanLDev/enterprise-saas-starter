// Runtime config — these are set as Lambda environment variables by CDK,
// available in server components and API routes (not client components).
// For client-side access, pass values from server components via props.
export const config = {
  apiUrl: process.env.API_URL ?? 'http://localhost:3001',
  userPoolId: process.env.USER_POOL_ID ?? '',
  userPoolClientId: process.env.USER_POOL_CLIENT_ID ?? '',
};
