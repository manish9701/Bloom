/**
 * Check DynamoDB Table Schema
 */

const fs = require('fs');
const path = require('path');

// Load .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnv();

const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || 'bloomGallery';
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

AWS.config.update({
  region: REGION,
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY
});

const dynamodb = new AWS.DynamoDB();

async function checkSchema() {
  try {
    console.log(`Checking schema for table: ${TABLE_NAME}\n`);
    
    const desc = await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
    
    console.log('📊 Key Schema:');
    desc.Table.KeySchema.forEach(key => {
      console.log(`   ${key.AttributeName} (${key.KeyType})`);
    });
    
    console.log('\n📋 Attribute Definitions:');
    desc.Table.AttributeDefinitions.forEach(attr => {
      console.log(`   ${attr.AttributeName}: ${attr.AttributeType}`);
    });
    
    console.log('\n✅ Table Status:', desc.Table.TableStatus);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
