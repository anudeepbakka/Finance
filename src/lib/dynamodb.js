import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';


const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const dynamoDb = DynamoDBDocumentClient.from(client);

export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'financing-lots-users',
  LOTS: process.env.DYNAMODB_LOTS_TABLE || 'financing-lots-lots',
  TRANSACTIONS: process.env.DYNAMODB_TRANSACTIONS_TABLE || 'financing-lots-transactions',
};

