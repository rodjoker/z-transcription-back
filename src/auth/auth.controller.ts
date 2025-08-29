import { Controller, Get, Query, Req, Res, InternalServerErrorException, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { URL } from 'url';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // Endpoint para iniciar el flujo de OAuth desde el frontend
  @Get('zendesk')
  @Redirect()
  startOAuth(@Query('subdomain') subdomain: string) {
    if (!subdomain) {
      throw new InternalServerErrorException('Se requiere el subdominio de Zendesk.');
    }

    // Obtener la configuración del .env
    const clientId = this.configService.get<string>('CLIENT_ID');
    const redirectUri = this.configService.get<string>('REDIRECT_URI');

    if (!clientId || !redirectUri) {
        throw new InternalServerErrorException('Faltan variables de entorno para la configuración de Zendesk.');
    }

    const authUrl = `https://${subdomain}.zendesk.com/oauth/authorizations/new?response_type=code&redirect_uri=${redirectUri}&client_id=${clientId}&scope=read%20write`;
    
    return { url: authUrl };
  }

  // Endpoint de callback que Zendesk llama después de la autorización
  @Get('callback')
  async handleZendeskCallback(
    @Query('code') code: string,
    @Query('subdomain') subdomain: string,
    @Res() res: Response
  ) {
    if (!code || !subdomain) {
      // Maneja el caso de que no se reciba un código o subdominio
      return res.redirect('http://localhost:3000?error=auth_failed');
    }

    try {
      // Pasa el subdominio al servicio para obtener los tokens
      const { accessToken, refreshToken } = await this.authService.getTokens(code, subdomain);

      // Redirige al frontend de Next.js
      return res.redirect(`http://localhost:3000?access_token=${accessToken}&refresh_token=${refreshToken}`);

    } catch (error) {
      console.error('Error en el callback de autenticación:', error);
      return res.redirect('http://localhost:3000?error=token_exchange_failed');
    }
  }
}
