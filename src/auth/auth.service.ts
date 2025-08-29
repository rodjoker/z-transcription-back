import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly zendeskConfig: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException('Faltan variables de entorno para la configuración de Zendesk.');
    }

    this.zendeskConfig = {
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: redirectUri,
    };
  }

  // El método getTokens recibe el subdominio como parámetro
  async getTokens(code: string, subdomain: string): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('Verificando variables de entorno en AuthService:');
    console.log('CLIENT_ID:', this.zendeskConfig.clientId);
    // console.log('CLIENT_SECRET:', this.zendeskConfig.clientSecret);
    console.log('SUBDOMAIN (dinámico):', subdomain);
    console.log('REDIRECT_URI:', this.zendeskConfig.redirectUri);
    console.log('--------------------------------------------------');

    const { clientId, clientSecret, redirectUri } = this.zendeskConfig;
    
    // Construye la URL de forma dinámica con el subdominio recibido
    const tokenUrl = `https://${subdomain}.zendesk.com/oauth/tokens`;

    try {
      const response = await axios.post(
        tokenUrl,
        {
          grant_type: 'authorization_code',
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          scope: 'read write'
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      
      const { access_token, refresh_token } = response.data;
      return { accessToken: access_token, refreshToken: refresh_token };
    } catch (error) {
      console.error('Error al intercambiar el código por tokens:', error.response.data);
      throw new InternalServerErrorException('No se pudo obtener el token de acceso.');
    }
  }
}