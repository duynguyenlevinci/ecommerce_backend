/**
 * MoMo-specific magic values that are part of the MoMo Payment Gateway v2 spec
 * (or our own conventions when calling it).
 */
export const MOMO = {
  /** Language code MoMo uses for UI/translations on the payment page. */
  LANG: 'vi',
  /** MoMo treats `resultCode === 0` as success in both create + IPN flows. */
  RESULT_CODE_SUCCESS: 0,
  /** Message we send back to MoMo to acknowledge the IPN. */
  IPN_ACK_MESSAGE: 'Acknowledged',
  /** Result code we return on IPN to acknowledge it was received. */
  IPN_ACK_RESULT_CODE: 0,
} as const;
