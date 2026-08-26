export const environment = {
  production: true,
  apiUrl: '/api',
  // Google OAuth 2.0 Client ID (Web application type) — a public value by
  // design (embedded in frontend JS, never a secret), used to initialize
  // the "Sign in with Google" button. Same value the backend's
  // GOOGLE_CLIENT_ID env var must hold, since it verifies the ID token's
  // audience against it.
  googleClientId: '319828413909-bevca2cnsr90ghgu3ht54co174q7jk5n.apps.googleusercontent.com',
};
