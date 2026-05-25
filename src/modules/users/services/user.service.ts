import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAGINATION } from '../../../common/constants/pagination.constants';
import {
  PaginatedResult,
  buildPaginatedResult,
} from '../../../common/dto/paginated-result.dto';
import { User } from '../../auth/models/entities/user.entity';
import { QueryUserDto } from '../models/dto/query-user.dto';
import { UpdateUserActiveDto } from '../models/dto/update-user-active.dto';
import { UpdateUserRoleDto } from '../models/dto/update-user-role.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const qb = this.userRepository.createQueryBuilder('user');

    const search = query.search?.trim();
    if (search) {
      qb.andWhere('(user.fullName ILIKE :spr OR user.email ILIKE :s)', {
        s: `%${search}%`,
      });
    }
    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (typeof query.isActive === 'boolean') {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  /**
   * Change a user's role and revoke their existing tokens so the new role is
   * picked up on the next sign-in.
   */
  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    actor: User,
  ): Promise<User> {
    if (id === actor.id) {
      throw new BadRequestException('You cannot change your own role');
    }
    const user = await this.findOne(id);
    user.role = dto.role;
    user.tokenInvalidatedAt = new Date();
    return this.userRepository.save(user);
  }

  /**
   * Enable or disable an account. Disabling also revokes existing tokens.
   */
  async updateActive(
    id: string,
    dto: UpdateUserActiveDto,
    actor: User,
  ): Promise<User> {
    if (id === actor.id) {
      throw new BadRequestException('You cannot change your own active status');
    }
    const user = await this.findOne(id);
    user.isActive = dto.isActive;
    if (!dto.isActive) {
      user.tokenInvalidatedAt = new Date();
    }
    return this.userRepository.save(user);
  }
}
