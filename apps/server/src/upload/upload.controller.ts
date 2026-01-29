import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Inject,
  Headers,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { UploadService } from "@chunkflow/upload-server";
import type {
  CreateFileRequest,
  CreateFileResponse,
  VerifyHashRequest,
  VerifyHashResponse,
  UploadChunkRequest,
  UploadChunkResponse,
  MergeFileRequest,
  MergeFileResponse,
} from "@chunkflow/protocol";
import { UPLOAD_SERVICE } from "./upload-service.provider";

@Controller("upload")
export class UploadController {
  constructor(
    @Inject(UPLOAD_SERVICE)
    private readonly uploadService: UploadService,
  ) {}

  @Post("create")
  async createFile(@Body() request: CreateFileRequest): Promise<CreateFileResponse> {
    try {
      return await this.uploadService.createFile(request);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : "Failed to create file",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post("verify")
  async verifyHash(@Body() request: VerifyHashRequest): Promise<VerifyHashResponse> {
    try {
      return await this.uploadService.verifyHash(request);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : "Failed to verify hash",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post("chunk")
  async uploadChunk(@Req() request: FastifyRequest): Promise<UploadChunkResponse> {
    try {
      // Parse multipart form data
      const data = await (request as any).file();
      if (!data) {
        throw new Error("No file uploaded");
      }

      const buffer = await data.toBuffer();
      const fields = data.fields as any;

      const uploadRequest: UploadChunkRequest = {
        uploadToken: fields.uploadToken?.value,
        chunkIndex: parseInt(fields.chunkIndex?.value),
        chunkHash: fields.chunkHash?.value,
        chunk: buffer,
      };

      return await this.uploadService.uploadChunk(uploadRequest);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : "Failed to upload chunk",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post("merge")
  async mergeFile(@Body() request: MergeFileRequest): Promise<MergeFileResponse> {
    try {
      return await this.uploadService.mergeFile(request);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : "Failed to merge file",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get("files/:fileId")
  async getFile(
    @Param("fileId") fileId: string,
    @Headers("range") rangeHeader: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    try {
      // Parse range header
      let range: { start: number; end: number } | undefined;
      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1]);
          const end = match[2] ? parseInt(match[2]) : undefined;
          if (!isNaN(start)) {
            range = { start, end: end || start + 10 * 1024 * 1024 }; // Default to 10MB range
          }
        }
      }

      const result = await this.uploadService.getFileStream(fileId, range);

      if (!result) {
        throw new Error("File not found or not completed");
      }

      // Set headers
      reply.header("Content-Type", result.mimeType || "application/octet-stream");
      reply.header("Accept-Ranges", "bytes");

      if (range) {
        reply.status(206);
        reply.header("Content-Range", `bytes ${range.start}-${range.end}/${result.size}`);
        reply.header("Content-Length", range.end - range.start + 1);
      } else {
        reply.status(200);
        reply.header("Content-Length", result.size);
      }

      // Pipe stream to response
      reply.send(result.stream);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : "Failed to get file",
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
