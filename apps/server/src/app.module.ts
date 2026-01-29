import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { UploadModule } from "./upload/upload.module";

@Module({
  imports: [DatabaseModule, UploadModule],
})
export class AppModule {}
