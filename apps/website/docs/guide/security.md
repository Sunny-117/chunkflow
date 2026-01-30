# Security

Security considerations and best practices for ChunkFlow.

## Token-Based Authentication

ChunkFlow uses upload tokens for authorization:

```typescript
interface UploadToken {
  token: string; // JWT or similar
  fileId: string; // File identifier
  chunkSize: number; // Negotiated chunk size
  expiresAt: number; // Expiration timestamp
}
```

## Server-Side Validation

### Token Validation

```typescript
// Verify token on every request
const fileId = verifyToken(uploadToken);
```

### Hash Validation

```typescript
// Verify chunk hash matches content
const calculatedHash = calculateHash(chunk);
if (calculatedHash !== chunkHash) {
  throw new Error("Hash mismatch");
}
```

### File Size Validation

```typescript
// Enforce maximum file size
if (fileSize > MAX_FILE_SIZE) {
  throw new Error("File too large");
}
```

## Client-Side Validation

### File Type Validation

```typescript
<UploadButton
  accept="image/*,video/*"
  maxSize={100 * 1024 * 1024}
/>
```

### Size Validation

```typescript
if (file.size > maxSize) {
  throw new FileValidationError("File too large");
}
```

## Best Practices

1. Always validate on server-side
2. Use HTTPS for all requests
3. Implement rate limiting
4. Set appropriate CORS headers
5. Sanitize file names
6. Scan uploaded files for malware
7. Implement access control
8. Use secure token generation
9. Set token expiration
10. Log security events

## CORS Configuration

```typescript
// Express
app.use(
  cors({
    origin: "https://your-domain.com",
    credentials: true,
  }),
);
```

## See Also

- [Server Configuration](/guide/server-config)
- [Error Handling](/guide/error-handling)
