# DynamoDB Setup Guide

This document explains how to configure AWS DynamoDB for cloud persistence in the Bloom app.

## Overview

The app uses a hybrid persistence strategy:
1. **Primary**: DynamoDB (when credentials are configured)
2. **Fallback**: localStorage (web) / AsyncStorage (native)

## Setup Steps

### 1. Create DynamoDB Table

Run this AWS CLI command (or use AWS Console):

```bash
aws dynamodb create-table \
  --table-name bloomGallery \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

Or use the AWS Console:
- Table name: `bloomGallery`
- Partition key: `pk` (String)
- Sort key: `sk` (String)
- Billing mode: Pay-per-request (no capacity planning needed)

### 2. Configure Environment Variables

Copy `.env.template` to `.env` and fill in your AWS credentials:

```env
# AWS Credentials (IAM user with DynamoDB access)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
DYNAMO_TABLE_NAME=bloomGallery
```

### 3. IAM Permissions

The IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/bloomGallery"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:ListTables"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Verify Setup

Run the app and check the console for:
- `[App] DynamoDB table ready for persistence` → Working!
- `[App] DynamoDB not configured, using localStorage fallback` → Using localStorage

## Data Structure

The app stores gallery items in DynamoDB with this schema:

| pk | sk | data |
|----|----|------|
| bloom_gallery_v2 | gallery | `[{id, imageUri, compositeUri, ...}, ...]` |

- **pk**: Fixed key `bloom_gallery_v2`
- **sk**: Fixed value `gallery`
- **data**: JSON array of gallery items (max 20 recent)

## Migration Notes

- **Existing localStorage data**: Automatically imported on first run
- **New saves**: Written to DynamoDB (and localStorage as backup)
- **Backward compatible**: Works without DynamoDB configuration

## Web Compatibility

The app works on web with DynamoDB! However:
- Browser localStorage is used when DynamoDB is not configured
- If DynamoDB is configured, it uses the HTTP client (no CORS issues with proper setup)

## Troubleshooting

### "Table not found"
Run the create-table command above, then restart the app.

### "Missing credentials"
Check that `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set in `.env`.

### "No data showing"
1. Check console for DynamoDB initialization messages
2. Verify table exists and has data
3. Check IAM permissions

### Web CORS issues
If using DynamoDB on web, ensure your AWS region and endpoint support browser requests.
