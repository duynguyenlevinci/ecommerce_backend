/**
 * Authentication-related magic values.
 */
export const AUTH = {
  /** OAuth2/JWT token type returned to the client on signin/signup. */
  TOKEN_TYPE_BEARER: 'Bearer',
  /** Fallback for `JWT_EXPIRES_IN` when the env var is unset. */
  DEFAULT_JWT_EXPIRES_IN: '30d',
  /** Fallback for `BCRYPT_SALT_ROUNDS` when the env var is unset. */
  DEFAULT_BCRYPT_SALT_ROUNDS: 10,
} as const;
