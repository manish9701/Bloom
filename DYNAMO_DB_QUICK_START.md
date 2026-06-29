# DynamoDB Quick Start Guide

This app now uses DynamoDB for cloud persistence with localStorage fallback.

## What Changed

1. **DynamoDB Integration** - Gallery data stored in AWS DynamoDB when credentials configured
2. **Web Compatibility** - App works on web using AWS SDK v3 (uses fetch)
3. **Fallback System** - Falls back to localStorage if DynamoDB not configured
4. **No Design Changes** - Everything looks the same, just better persistence

## Files Created/Modified

| File | Purpose |
|------|---------|
| `lib/dynamo.ts` | DynamoDB service layer |
| `lib/store.ts` | Updated to use DynamoDB + localStorage fallback |
| `app/_layout.tsx` | Added DynamoDB initialization on app start |
| `.env.template` | Updated with DynamoDB config examples |
| `.env` | Your credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) |
| `DYNAMO_SETUP.md` | Detailed setup documentation |
| `setup-dynamodb.js` | Script to create DynamoDB table |

## Setup (5 minutes)

### 1. Create DynamoDB Table (One-time)

Run this in your terminal:
```bash
aws dynamodb create-table ^
  --table-name bloomGallery ^
  --attribute-definitions ^
    AttributeName=pk,AttributeType=S ^
    AttributeName=sk,AttributeType=S ^
  --key-schema ^
    AttributeName=pk,KeyType=HASH ^
    AttributeName=sk,KeyType=RANGE ^
  --billing-mode PAY_PER_REQUEST
```

Or use the AWS Console: https://console.aws.amazon.com/dynamodb

### 2. Add Credentials to `.env`

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
DYNAMO_TABLE_NAME=bloomGallery
```

### 3. Restart the App

```bash
npm start
```

## How It Works

```
User saves look
     ↓
DynamoDB (if credentials configured)
     ↓
localStorage (fallback for web)
     ↓
AsyncStorage (fallback for native)
```

## Testing

1. **With DynamoDB**: Check console for `[Store] Saved to DynamoDB table: bloomGallery`
2. **Without DynamoDB**: Check console for `[App] DynamoDB not configured, using localStorage fallback`

## Web Deployment

The app works on web with:
- DynamoDB: Uses AWS SDK v3 browser-compatible HTTP client
- localStorage: Standard browser API

No CORS configuration needed for AWS services in most regions.

## Migration

- Existing localStorage data → Automatically imported on first run
- New saves → Written to DynamoDB (and localStorage as backup)
