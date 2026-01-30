# Server Integration Examples

Examples for integrating ChunkFlow on the server side.

## Nest.js Integration

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "@chunkflow/upload-server";
import type { FastifyReply } from "fastify";

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("create")
  async createFile(@Body() request: CreateFileRequest) {
    return this.uploadService.createFile(request);
  }

  @Post("verify")
  async verifyHash(@Body() request: VerifyHashRequest) {
    return this.uploadService.verifyHash(request);
  }

  @Post("chunk")
  @UseInterceptors(FileInterceptor("chunk"))
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { uploadToken: string; chunkIndex: string; chunkHash: string },
  ) {
    return this.uploadService.uploadChunk({
      uploadToken: body.uploadToken,
      chunkIndex: parseInt(body.chunkIndex),
      chunkHash: body.chunkHash,
      chunk: file.buffer,
    });
  }

  @Post("merge")
  async mergeFile(@Body() request: MergeFileRequest) {
    return this.uploadService.mergeFile(request);
  }

  @Get("files/:fileId")
  async getFile(@Param("fileId") fileId: string, @Res() res: FastifyReply) {
    const stream = await this.uploadService.getFileStream(fileId);
    res.send(stream);
  }
}
```

## Express Integration

```typescript
import express from "express";
import multer from "multer";
import { UploadService, LocalStorageAdapter, PostgreSQLAdapter } from "@chunkflow/upload-server";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const storage = new LocalStorageAdapter("./storage");
const database = new PostgreSQLAdapter({
  host: "localhost",
  port: 5432,
  database: "chunkflow",
  user: "postgres",
  password: "postgres",
});

const uploadService = new UploadService({
  storageAdapter: storage,
  database,
  tokenSecret: "your-secret-key",
});

app.post("/api/upload/create", express.json(), async (req, res) => {
  try {
    const result = await uploadService.createFile(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/upload/verify", express.json(), async (req, res) => {
  try {
    const result = await uploadService.verifyHash(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/upload/chunk", upload.single("chunk"), async (req, res) => {
  try {
    const result = await uploadService.uploadChunk({
      uploadToken: req.body.uploadToken,
      chunkIndex: parseInt(req.body.chunkIndex),
      chunkHash: req.body.chunkHash,
      chunk: req.file.buffer,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/upload/merge", express.json(), async (req, res) => {
  try {
    const result = await uploadService.mergeFile(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/files/:fileId", async (req, res) => {
  try {
    const stream = await uploadService.getFileStream(req.params.fileId);
    stream.pipe(res);
  } catch (error) {
    res.status(404).json({ error: "File not found" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

## Custom Storage Adapter

```typescript
import { StorageAdapter } from "@chunkflow/upload-server";
import AWS from "aws-sdk";

export class S3StorageAdapter implements StorageAdapter {
  private s3: AWS.S3;
  private bucket: string;

  constructor(config: { bucket: string; region: string }) {
    this.bucket = config.bucket;
    this.s3 = new AWS.S3({ region: config.region });
  }

  async saveChunk(chunkHash: string, data: Buffer): Promise<void> {
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: `chunks/${chunkHash}`,
        Body: data,
      })
      .promise();
  }

  async getChunk(chunkHash: string): Promise<Buffer> {
    const result = await this.s3
      .getObject({
        Bucket: this.bucket,
        Key: `chunks/${chunkHash}`,
      })
      .promise();
    return result.Body as Buffer;
  }

  async chunkExists(chunkHash: string): Promise<boolean> {
    try {
      await this.s3
        .headObject({
          Bucket: this.bucket,
          Key: `chunks/${chunkHash}`,
        })
        .promise();
      return true;
    } catch {
      return false;
    }
  }

  async chunksExist(chunkHashes: string[]): Promise<boolean[]> {
    return Promise.all(chunkHashes.map((hash) => this.chunkExists(hash)));
  }

  async getChunkStream(chunkHash: string): Promise<ReadableStream> {
    return this.s3
      .getObject({
        Bucket: this.bucket,
        Key: `chunks/${chunkHash}`,
      })
      .createReadStream();
  }
}
```

## See Also

- [Server API](/api/server)
- [Server Configuration](/guide/server-config)
- [Storage Adapters](/guide/storage-adapters)
