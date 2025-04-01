// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.register(createUserDto);
  }

  // GET /users/students
  @Get('students')
  async findAllStudents() {
    return this.usersService.findAllStudents();
  }

  // GET /users/teachers
  @Get('teachers')
  async findAllTeachers() {
    return this.usersService.findAllTeachers();
  }

  // Endpoint para obtener datos de usuarios a partir de una lista de IDs
  @Post('by-ids')
  async getUsersByIds(@Body('ids') ids: string[]): Promise<any> {
    return this.usersService.findUsersByIds(ids);
  }

  @Post()
  async create(@Body() createUserDto: Partial<User>): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<User>,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  /**
   * Endpoint para recuperar la contraseña.
   * Se espera que en el body se envíe el email del usuario.
   */
  @Post('recover-password')
  async recoverPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    const message = await this.usersService.recoverPassword(email);
    return { message };
  }

  /**
   * Endpoint para cambiar la contraseña.
   * Se espera que en el body se envíe el id del usuario antigua y la nueva contraseña.
   */

  @Put(':id/new-password')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePassword(
    @Param('id') userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword} = updatePasswordDto;

    await this.usersService.updatePassword(userId, oldPassword, newPassword);
    return { message: 'Contraseña actualizada correctamente' };
  }
  /**
   * Endpoint para enviar correos de recordatorio.
   * Se espera que en el body se envíe el nombre del curso y una lista de correos electrónicos.
   */
  @Post('send-reminder-emails')
  async sendReminderEmails(
    @Body('courseName') courseName: string,
    @Body('emails') emails: string[],
  ) {
    await this.usersService.sendReminderEmails(courseName, emails);
    return { message : 'Correos enviados correctamente' };
  }
  
}
