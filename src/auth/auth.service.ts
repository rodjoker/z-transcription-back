import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config'; // Importa ConfigService

@Injectable()
export class AuthService {
  private readonly zendeskConfig: {
    clientId: string;
    clientSecret: string;
    subdomain: string;
    redirectUri: string;
  };

  constructor(private configService: ConfigService) {
    // Inicializa la propiedad aquí, dentro del constructor
    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');
    const subdomain = this.configService.get<string>('SUBDOMAIN');
    const redirectUri = this.configService.get<string>('REDIRECT_URI');

    // Valida que las variables no sean undefined antes de asignarlas
    if (!clientId || !clientSecret || !subdomain || !redirectUri) {
      throw new InternalServerErrorException('Faltan variables de entorno para la configuración de Zendesk.');
    }

    this.zendeskConfig = {
      clientId: clientId,
      clientSecret: clientSecret,
      subdomain: subdomain,
      redirectUri: redirectUri,
    };
  }

  async getTokens(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { clientId, clientSecret, subdomain, redirectUri } = this.zendeskConfig;
    
    // Esta validación se ha movido al constructor para evitar el error de TypeScript
    // y asegurar que el servicio no se inicie si faltan las variables.
    
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