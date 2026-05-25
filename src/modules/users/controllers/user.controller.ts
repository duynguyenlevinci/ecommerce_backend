import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { User } from '../../auth/models/entities/user.entity';
import { QueryUserDto } from '../models/dto/query-user.dto';
import { UpdateUserActiveDto } from '../models/dto/update-user-active.dto';
import { UpdateUserRoleDto } from '../models/dto/update-user-role.dto';
import { UserService } from '../services/user.service';

@ApiTags('admin / users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @ApiOperation({ summary: 'List users (paginated, filter by role / active / search)' })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id/role')
  @ApiOperation({
    summary: 'Change a user role (also revokes their existing tokens)',
  })
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: User,
  ) {
    return this.userService.updateRole(id, dto, actor);
  }

  @Patch(':id/active')
  @ApiOperation({
    summary: 'Enable or disable a user account (disabling revokes tokens)',
  })
  updateActive(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserActiveDto,
    @CurrentUser() actor: User,
  ) {
    return this.userService.updateActive(id, dto, actor);
  }
}
