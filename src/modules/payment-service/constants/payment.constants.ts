/**
 * Defaults applied to every payment record we create.
 */
export const PAYMENT = {
  /** Currency the payments are denominated in. MoMo only supports VND. */
  DEFAULT_CURRENCY: 'VND',
  /** Prefix of the unique requestId we attach to each payment attempt. */
  REQUEST_ID_PREFIX: 'REQ-',
  /** Random base36 suffix length, appended to `${PREFIX}${ts}-`. */
  REQUEST_ID_RANDOM_SUFFIX_LENGTH: 6,
} as const;
