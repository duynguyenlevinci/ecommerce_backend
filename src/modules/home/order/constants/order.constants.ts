import { OrderStatus } from '../../../../common/enums/order-status.enum';

/**
 * Configuration for the human-readable order code generated when a customer
 * places an order. Format: `${PREFIX}${unixMillis}-${randomBase36}`.
 *
 * Example: `ORD-1717000000000-AB12`
 */
export const ORDER_CODE = {
  PREFIX: 'ORD-',
  RANDOM_SUFFIX_LENGTH: 4,
} as const;

/**
 * Order status finite-state machine. Each key lists statuses that are
 * legal to transition INTO from that state. Used by
 * `OrderService.updateStatus` to reject illegal jumps such as
 * `PENDING → DELIVERED`.
 */
export const ORDER_STATUS_TRANSITIONS: Readonly<
  Record<OrderStatus, ReadonlyArray<OrderStatus>>
> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

/** Who triggered an order-status transition (for the audit trail). */
export const ORDER_CHANGED_BY = {
  SYSTEM: 'system',
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type OrderChangedBy =
  (typeof ORDER_CHANGED_BY)[keyof typeof ORDER_CHANGED_BY];
