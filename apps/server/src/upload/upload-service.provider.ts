import { Provider } from "@nestjs/common";
import { Pool } from "pg";
import { UploadService, LocalStorageAdapter } from "@chunkflow/upload-server";
import { PostgresAdapter } from "../database/postgres-adapter";
import { DATABASE_POOL } from "../database/database.module";

export const UPLOAD_SERVICE = "UPLOAD_SERVICE";

export const UploadServiceProvider: Provider = {
  provide: UPLOAD_SERVICE,
  useFactory: async (pool: Pool) => {
    const storagePath = process.env.STORAGE_PATH || "./storage";
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";

    const storageAdapter = new LocalStorageAdapter({ baseDir: storagePath });
    const databaseAdapter = new PostgresAdapter(pool);

    const uploadService = new UploadService({
      storageAdapter,
      databaseAdapter,
      jwtSecret,
    });

    await uploadService.initialize();

    return uploadService;
  },
  inject: [DATABASE_POOL],
};
