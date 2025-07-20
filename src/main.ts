import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { checkEnvFile } from './utils/check-env-file';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  checkEnvFile();
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Thiết lập global prefix
  app.setGlobalPrefix('api');

  // Thiết lập validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true, // Stop at first validation error
      validateCustomDecorators: true, // Enable custom validators
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('OpenGive API')
    .setDescription(
      `
      # OpenGive - Authentication & Donation Platform API
      
      ## Authentication Flow
      1. **Register**: Create account with password confirmation
      2. **Login**: Authenticate with email/password + optional 2FA
      3. **2FA Setup**: Enable TOTP authentication for enhanced security
      4. **Token Management**: Use access/refresh token rotation
      
      ## Security Features
      - Password hashing with bcrypt
      - JWT token versioning
      - Account lockout protection
      - 2FA with Google Authenticator
      - Rate limiting on sensitive endpoints
      
      ## API Usage
      - Most endpoints require Bearer token authentication
      - Refresh tokens automatically when access token expires
      - Use logout endpoints to invalidate sessions
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth', // This name should match @ApiBearerAuth('JWT-auth')
    )
    .addTag('auth', 'Authentication and user management')
    .addTag('users', 'User profile operations')
    .addTag('campaigns', 'Donation campaign management')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.opengive.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization after page refresh
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'OpenGive API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: ['https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css'],
  });

  // Nếu bạn chạy trong WSL/Container, bind ra 0.0.0.0
  const host = process.env.HOST || '0.0.0.0';
  const port = process.env.PORT || 3000;

  await app.listen(port, host);

  // Lấy url đầy đủ và log ra
  const url = await app.getUrl();
  logger.log(`🚀 Application running on: ${url}`);
  logger.log(`📚 API Documentation: ${url}/api/docs`);
  logger.log(`🔐 Authentication endpoints: ${url}/api/auth`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
