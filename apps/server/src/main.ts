import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // Register multipart plugin
  await app.register(require("@fastify/multipart"), {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max chunk size
    },
  });

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");

  console.log(`ChunkFlow Upload Server is running on: http://localhost:${port}`);
}

bootstrap();
