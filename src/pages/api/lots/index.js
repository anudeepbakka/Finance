import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { Lot } from '@/lib/models';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    // Create new lot
    const { title, description, borrowerName, expectedCloseDate, currency } = req.body;

    if (!title || !borrowerName) {
      return res.status(400).json({ message: 'Title and borrower name are required' });
    }

    try {
      const lot = new Lot({
        userId: session.user.id,
        title,
        description,
        borrowerName,
        expectedCloseDate,
        currency: currency || 'INR',
      });

      await dynamoDb.send(new PutCommand({
        TableName: TABLES.LOTS,
        Item: lot.toItem()
      }));

      res.status(201).json({ lot: lot.toItem() });
    } catch (error) {
      console.error('Create lot error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Get user's lots
    try {
      const result = await dynamoDb.send(new QueryCommand({
        TableName: TABLES.LOTS,
        IndexName: 'UserIdIndex', // You'll need to create this GSI
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': session.user.id
        },
        ScanIndexForward: false // Most recent first
      }));

      res.status(200).json({ lots: result.Items || [] });
    } catch (error) {
      console.error('Get lots error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
