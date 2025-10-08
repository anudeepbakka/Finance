import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing DynamoDB connection...');
    console.log('📊 Environment variables check:');
    console.log('- AWS_REGION:', !!process.env.AWS_REGION);
    console.log('- AWS_ACCESS_KEY_ID:', !!process.env.AWS_ACCESS_KEY_ID);
    console.log('- AWS_SECRET_ACCESS_KEY:', !!process.env.AWS_SECRET_ACCESS_KEY);
    console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('- NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET);
    console.log('- DYNAMODB_USERS_TABLE:', process.env.DYNAMODB_USERS_TABLE);

    // Test DynamoDB connection
    const result = await dynamoDb.send(new ScanCommand({
      TableName: TABLES.USERS,
      Limit: 1
    }));

    console.log('✅ DynamoDB connection successful');
    console.log('👥 Users found:', result.Count);

    res.status(200).json({
      success: true,
      message: 'All systems operational',
      environment: {
        hasAWSRegion: !!process.env.AWS_REGION,
        hasAWSCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        usersTable: TABLES.USERS,
      },
      dynamodb: {
        connected: true,
        usersCount: result.Count,
      }
    });
  } catch (error) {
    console.error('💥 Test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      environment: {
        hasAWSRegion: !!process.env.AWS_REGION,
        hasAWSCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        usersTable: TABLES.USERS,
      }
    });
  }
}
