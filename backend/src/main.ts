import 'reflect-metadata';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { assertWritableDir } from './modules/media/storage.js';
import type { Request, Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  logger: new ConsoleLogger({ json: isProd, colors: !isProd }),
  bufferLogs: true,
});

const config = app.get(AppConfigService);
// Падаем на старте, а не на первой заявке с вложением.
await assertWritableDir(config.uploadDir);

app.setGlobalPrefix('api/v1');
// Без этого req.ip — адрес ближайшего клиента, то есть сервера Next для
// каждой заявки с сайта: лимиты по IP тогда общие для всех посетителей.
app.set('trust proxy', config.trustProxy);
app.use(
  helmet({
    // next/image с другого порта тянет картинки из /uploads — иначе CORP их режет.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.enableCors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
});
// Вложения заявок лежат в том же UPLOAD_DIR, но это документы клиентов:
// отдаёт их только авторизованный /admin/leads/:id/attachments/:aid.
// Без этой заглушки статика ниже раздала бы их всем по прямой ссылке.
app.use('/uploads/leads', (_req: Request, res: Response) => {
  res.status(404).end();
});
// Статика /uploads вне globalPrefix: это сырой express-слой.
app.useStaticAssets(config.uploadDir, {
  prefix: '/uploads',
  maxAge: '365d',
  index: false,
  dotfiles: 'deny',
});
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
app.enableShutdownHooks();

if (!config.isProduction) {
  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Tabys Admin API')
      .setDescription('Бэкенд админки: каталог, заявки, медиа')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, doc);
}

await app.listen(config.port);
