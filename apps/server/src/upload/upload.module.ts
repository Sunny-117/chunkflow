import { Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadServiceProvider } from "./upload-service.provider";

@Module({
  controllers: [UploadController],
  providers: [UploadServiceProvider],
})
export class UploadModule {}
