import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../../modules/auth/models/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
