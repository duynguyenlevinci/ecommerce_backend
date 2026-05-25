import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_TRANSFORM_KEY = 'skipResponseTransform';

/**
 * Mark a route handler (or controller) so the global ResponseInterceptor
 * leaves its return value untouched. Use this for callbacks/webhooks where
 * the consumer expects an exact response shape (e.g. MoMo IPN).
 */
export const SkipResponseTransform = () =>
  SetMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true);
