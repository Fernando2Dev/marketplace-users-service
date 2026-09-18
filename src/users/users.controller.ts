import { Controller, Get, Param, ParseUUIDPipe, Request } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './entity/user.entity.js';

interface JwtUserPayload {
  id: string;
  email: string;
  role: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  profile(@Request() req: { user: JwtUserPayload }): Promise<User> {
    return this.users.findById(req.user.id);
  }

  @Get('sellers')
  sellers(): Promise<User[]> {
    return this.users.findActiveSellers();
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.users.findById(id);
  }
}
