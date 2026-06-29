/**
 * DynamoDB service for Bloom
 * Works on both web and native platforms
 * 
 * Note for Web: AWS SDK v3 uses fetch() under the hood, making it compatible with React Native Web.
 * Ensure your AWS region supports browser requests if using DynamoDB on web.
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// Environment variables
const AWS_REGION = process.env.AWS_REGION?.trim() || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";
const TABLE_NAME = process.env.DYNAMO_TABLE_NAME?.trim() || "bloomGallery";

// DynamoDB client - only instantiate if credentials are available
let dynamoClient: DynamoDBClient | null = null;
let ddbDocClient: DynamoDBDocumentClient | null = null;

function createDynamoClients() {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.warn("DynamoDB: Missing credentials, using localStorage fallback");
    return null;
  }

  try {
    dynamoClient = new DynamoDBClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
    ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
    return ddbDocClient;
  } catch (e) {
    console.warn("DynamoDB: Failed to create client:", e);
    return null;
  }
}

// Get the document client (creates on first call if needed)
function getDocClient() {
  if (ddbDocClient) return ddbDocClient;
  return createDynamoClients();
}

// Check if DynamoDB is available
export function isDynamoAvailable(): boolean {
  return !!getDocClient();
}

// Get the table name (use environment or default)
export function getTableName(): string {
  return TABLE_NAME;
}

// ─── Gallery operations ───────────────────────────────────────────────────────

const GALLERY_KEY = "bloom_gallery_v2";

export interface DynamoGalleryItem {
  id: string;  // Primary key
  type: string;  // Sort key
  data: string;
  ttl?: number;
}

// Initialize table if needed (call once on app startup)
export async function ensureTableExists(): Promise<boolean> {
  if (!getDocClient()) return false;
  
  try {
    const client = getDocClient();
    if (!client) return false;

    // Try a simple operation to verify connectivity
    await client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 1,
      })
    );
    return true;
  } catch (e: any) {
    if (e.name === "ResourceNotFoundException") {
      console.log(`DynamoDB: Table "${TABLE_NAME}" not found. Please create it.`);
      return false;
    }
    console.warn("DynamoDB: Table check failed:", e);
    return false;
  }
}

// Get gallery from DynamoDB
export async function getGalleryFromDynamo(): Promise<any[]> {
  if (!getDocClient()) return [];

  try {
    const client = getDocClient();
    if (!client) return [];

    // Use Scan with FilterExpression to find gallery items
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": GALLERY_KEY,
      },
    };

    const result = await client.send(new ScanCommand(params));
    
    // Handle different response types from DynamoDB
    const items = (result as any).Items;
    if (items && items.length > 0) {
      return JSON.parse(items[0].data || "[]");
    }
    return [];
  } catch (e) {
    console.warn("[Dynamo] getGallery failed:", e);
    return [];
  }
}

// Save gallery to DynamoDB
export async function saveGalleryToDynamo(data: any[]): Promise<boolean> {
  if (!getDocClient()) return false;

  try {
    const client = getDocClient();
    if (!client) return false;

    const item: DynamoGalleryItem = {
      id: GALLERY_KEY,
      type: "gallery",
      data: JSON.stringify(data.slice(0, 20)), // Keep last 20 items
    };

    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    return true;
  } catch (e) {
    console.warn("[Dynamo] saveGallery failed:", e);
    return false;
  }
}

// Get single item from DynamoDB
export async function getGlowUpFromDynamo(id: string): Promise<any | null> {
  if (!getDocClient()) return null;

  try {
    const client = getDocClient();
    if (!client) return null;

    const gallery = await getGalleryFromDynamo();
    return gallery.find((g: any) => g.id === id) ?? null;
  } catch (e) {
    console.warn("[Dynamo] getGlowUpById failed:", e);
    return null;
  }
}

// Delete item from DynamoDB gallery
export async function deleteGlowUpFromDynamo(id: string): Promise<boolean> {
  if (!getDocClient()) return false;

  try {
    const client = getDocClient();
    if (!client) return false;

    const gallery = await getGalleryFromDynamo();
    const filtered = gallery.filter((g: any) => g.id !== id);
    return await saveGalleryToDynamo(filtered);
  } catch (e) {
    console.warn("[Dynamo] deleteGlowUp failed:", e);
    return false;
  }
}

// Clear gallery from DynamoDB
export async function clearGalleryFromDynamo(): Promise<boolean> {
  if (!getDocClient()) return false;

  try {
    const client = getDocClient();
    if (!client) return false;

    return await saveGalleryToDynamo([]);
  } catch (e) {
    console.warn("[Dynamo] clearGallery failed:", e);
    return false;
  }
}
