import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { checkEnvFile } from './utils/check-env-file';

async function bootstrap() {
  checkEnvFile();
  const app = await NestFactory.create(AppModule);

  // Nếu bạn chạy trong WSL/Container, bind ra 0.0.0.0
  const host = process.env.HOST || '0.0.0.0';
  const port = process.env.PORT || 3000;

  await app.listen(port, host);

  // Lấy url đầy đủ và log ra
  const url = await app.getUrl();
  console.log(`🚀 Application is running on: ${url}`);
}
bootstrap();
