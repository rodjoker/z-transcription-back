import { Controller, Get, Query, Redirect, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('callback')
  async handleZendeskCallback(@Query('code') code: string, 
  @Res() res: Response,
  @Req() req: Request,
) {
    console.log('Encabezado:', req.headers['referer']);
    if (!code) {
      // Maneja el caso de que no se reciba un código de autorización
      return res.redirect('http://localhost:3000?error=auth_failed');
    }

    try {
      const { accessToken, refreshToken } = await this.authService.getTokens(code);

      // Redirige al frontend de Next.js, pasando los tokens.
      // Puedes pasarlos como parámetros de URL o guardarlos en una sesión/cookie segura.
      // Por ejemplo, aquí los pasamos como parámetros de URL para simplicidad.
      return res.redirect(`http://localhost:3000?access_token=${accessToken}&refresh_token=${refreshToken}`);

    } catch (error) {
      console.error('Error en el callback de autenticación:', error);
      return res.redirect('http://localhost:3000?error=token_exchange_failed');
    }
  }
}