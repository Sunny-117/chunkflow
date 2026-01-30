#!/bin/bash

# ChunkFlow Upload Demo Script
# This script demonstrates the complete file upload flow with chunking

set -e

# Configuration
SERVER_URL="http://localhost:3001"
FILE_PATH="$1"
CHUNK_SIZE=2097152  # 2MB chunks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if file exists
if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}❌ Error: File not found${NC}"
    echo "Usage: $0 <file_path>"
    exit 1
fi

FILE_NAME=$(basename "$FILE_PATH")
FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH")
FILE_TYPE=$(file -b --mime-type "$FILE_PATH")

echo -e "${BLUE}📦 ChunkFlow Upload Demo${NC}"
echo -e "${BLUE}========================${NC}"
echo -e "File: ${GREEN}$FILE_NAME${NC}"
echo -e "Size: ${GREEN}$(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo $FILE_SIZE bytes)${NC}"
echo -e "Type: ${GREEN}$FILE_TYPE${NC}"
echo ""

# Calculate file hash (MD5)
echo -e "${YELLOW}🔐 Calculating file hash...${NC}"
FILE_HASH=$(md5 -q "$FILE_PATH" 2>/dev/null || md5sum "$FILE_PATH" | awk '{print $1}')
echo -e "Hash: ${GREEN}$FILE_HASH${NC}"
echo ""

# Step 1: Create upload session
echo -e "${YELLOW}📝 Step 1: Creating upload session...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$SERVER_URL/upload/create" \
  -H "Content-Type: application/json" \
  -d "{
    \"fileName\": \"$FILE_NAME\",
    \"fileSize\": $FILE_SIZE,
    \"fileType\": \"$FILE_TYPE\",
    \"preferredChunkSize\": $CHUNK_SIZE
  }")

UPLOAD_TOKEN=$(echo "$CREATE_RESPONSE" | jq -r '.uploadToken')
NEGOTIATED_CHUNK_SIZE=$(echo "$CREATE_RESPONSE" | jq -r '.negotiatedChunkSize')

if [ "$UPLOAD_TOKEN" == "null" ]; then
    echo -e "${RED}❌ Failed to create upload session${NC}"
    echo "$CREATE_RESPONSE" | jq .
    exit 1
fi

echo -e "✅ Upload session created"
echo -e "Token: ${GREEN}${UPLOAD_TOKEN:0:50}...${NC}"
echo -e "Chunk size: ${GREEN}$(numfmt --to=iec-i --suffix=B $NEGOTIATED_CHUNK_SIZE 2>/dev/null || echo $NEGOTIATED_CHUNK_SIZE bytes)${NC}"
echo ""

# Calculate total chunks
TOTAL_CHUNKS=$(( ($FILE_SIZE + $NEGOTIATED_CHUNK_SIZE - 1) / $NEGOTIATED_CHUNK_SIZE ))
echo -e "Total chunks: ${GREEN}$TOTAL_CHUNKS${NC}"
echo ""

# Step 2: Split file and calculate chunk hashes
echo -e "${YELLOW}🔪 Step 2: Splitting file and calculating chunk hashes...${NC}"
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Split file into chunks
split -b $NEGOTIATED_CHUNK_SIZE "$FILE_PATH" "$TEMP_DIR/chunk_"

# Calculate chunk hashes
CHUNK_HASHES=()
CHUNK_INDEX=0
for chunk_file in "$TEMP_DIR"/chunk_*; do
    chunk_hash=$(md5 -q "$chunk_file" 2>/dev/null || md5sum "$chunk_file" | awk '{print $1}')
    CHUNK_HASHES+=("$chunk_hash")
    echo -e "  Chunk $CHUNK_INDEX: ${GREEN}$chunk_hash${NC}"
    ((CHUNK_INDEX++))
done
echo ""

# Step 3: Verify hashes (check for instant upload)
echo -e "${YELLOW}🔍 Step 3: Verifying hashes (checking for instant upload)...${NC}"
CHUNK_HASHES_JSON=$(printf '%s\n' "${CHUNK_HASHES[@]}" | jq -R . | jq -s .)

VERIFY_RESPONSE=$(curl -s -X POST "$SERVER_URL/upload/verify" \
  -H "Content-Type: application/json" \
  -d "{
    \"uploadToken\": \"$UPLOAD_TOKEN\",
    \"fileHash\": \"$FILE_HASH\",
    \"chunkHashes\": $CHUNK_HASHES_JSON
  }")

FILE_EXISTS=$(echo "$VERIFY_RESPONSE" | jq -r '.fileExists')
EXISTING_CHUNKS=$(echo "$VERIFY_RESPONSE" | jq -r '.existingChunks | length')
MISSING_CHUNKS=$(echo "$VERIFY_RESPONSE" | jq -r '.missingChunks | length')

if [ "$FILE_EXISTS" == "true" ]; then
    echo -e "${GREEN}✅ File already exists! Instant upload (秒传)${NC}"
    FILE_URL=$(echo "$VERIFY_RESPONSE" | jq -r '.fileUrl')
    echo -e "File URL: ${GREEN}$FILE_URL${NC}"
    exit 0
fi

echo -e "Existing chunks: ${GREEN}$EXISTING_CHUNKS${NC}"
echo -e "Missing chunks: ${YELLOW}$MISSING_CHUNKS${NC}"
echo ""

# Step 4: Upload chunks
echo -e "${YELLOW}📤 Step 4: Uploading chunks...${NC}"
CHUNK_INDEX=0
UPLOADED_COUNT=0

for chunk_file in "$TEMP_DIR"/chunk_*; do
    chunk_hash="${CHUNK_HASHES[$CHUNK_INDEX]}"
    
    # Check if chunk already exists
    if echo "$VERIFY_RESPONSE" | jq -e ".existingChunks | index($CHUNK_INDEX)" > /dev/null 2>&1; then
        echo -e "  Chunk $CHUNK_INDEX: ${BLUE}⏭️  Skipped (already exists)${NC}"
    else
        # Upload chunk
        UPLOAD_CHUNK_RESPONSE=$(curl -s -X POST "$SERVER_URL/upload/chunk" \
          -F "uploadToken=$UPLOAD_TOKEN" \
          -F "chunkIndex=$CHUNK_INDEX" \
          -F "chunkHash=$chunk_hash" \
          -F "file=@$chunk_file")
        
        SUCCESS=$(echo "$UPLOAD_CHUNK_RESPONSE" | jq -r '.success')
        if [ "$SUCCESS" == "true" ]; then
            echo -e "  Chunk $CHUNK_INDEX: ${GREEN}✅ Uploaded${NC}"
            ((UPLOADED_COUNT++))
        else
            echo -e "  Chunk $CHUNK_INDEX: ${RED}❌ Failed${NC}"
            echo "$UPLOAD_CHUNK_RESPONSE" | jq .
        fi
    fi
    
    ((CHUNK_INDEX++))
    
    # Progress indicator
    PROGRESS=$(( $CHUNK_INDEX * 100 / $TOTAL_CHUNKS ))
    echo -ne "  Progress: ${GREEN}$PROGRESS%${NC} ($CHUNK_INDEX/$TOTAL_CHUNKS)\r"
done

echo ""
echo -e "${GREEN}✅ All chunks uploaded ($UPLOADED_COUNT new, $(($TOTAL_CHUNKS - $UPLOADED_COUNT)) skipped)${NC}"
echo ""

# Step 5: Merge file
echo -e "${YELLOW}🔗 Step 5: Merging chunks...${NC}"
MERGE_RESPONSE=$(curl -s -X POST "$SERVER_URL/upload/merge" \
  -H "Content-Type: application/json" \
  -d "{
    \"uploadToken\": \"$UPLOAD_TOKEN\",
    \"fileHash\": \"$FILE_HASH\",
    \"chunkHashes\": $CHUNK_HASHES_JSON
  }")

SUCCESS=$(echo "$MERGE_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
    FILE_URL=$(echo "$MERGE_RESPONSE" | jq -r '.fileUrl')
    FILE_ID=$(echo "$MERGE_RESPONSE" | jq -r '.fileId')
    echo -e "${GREEN}✅ File merged successfully!${NC}"
    echo -e "File ID: ${GREEN}$FILE_ID${NC}"
    echo -e "File URL: ${GREEN}$SERVER_URL$FILE_URL${NC}"
    echo ""
    
    # Step 6: Verify download
    echo -e "${YELLOW}📥 Step 6: Verifying download...${NC}"
    DOWNLOAD_SIZE=$(curl -s -I "$SERVER_URL$FILE_URL" | grep -i content-length | awk '{print $2}' | tr -d '\r')
    if [ "$DOWNLOAD_SIZE" == "$FILE_SIZE" ]; then
        echo -e "${GREEN}✅ Download verification successful!${NC}"
        echo -e "Original size: ${GREEN}$FILE_SIZE bytes${NC}"
        echo -e "Download size: ${GREEN}$DOWNLOAD_SIZE bytes${NC}"
    else
        echo -e "${RED}❌ Size mismatch!${NC}"
        echo -e "Original size: $FILE_SIZE bytes"
        echo -e "Download size: $DOWNLOAD_SIZE bytes"
    fi
else
    echo -e "${RED}❌ Failed to merge file${NC}"
    echo "$MERGE_RESPONSE" | jq .
    exit 1
fi

echo ""
echo -e "${BLUE}🎉 Upload complete!${NC}"
