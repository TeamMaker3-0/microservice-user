// src/auth/auth.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.authService.login(loginDto);
    
    // Configurar la cookie para compartir entre puertos (en desarrollo, dominio 'localhost')
    res.cookie('token', access_token, {
      httpOnly: true, // Impide el acceso desde JavaScript para mayor seguridad
      secure: false, // solo HTTPS en producción
      domain: 'localhost', // Permite que la cookie se comparta en diferentes puertos de localhost
      path: '/',
    });

    // Retorna solo los datos del usuario; el token se envía vía cookie
    return { access_token };
  }
}
