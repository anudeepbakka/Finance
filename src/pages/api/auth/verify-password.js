import { getServerSession } from 'next-auth';
import { authOptions } from './[...nextauth]';
import bcrypt from 'bcryptjs';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    // Get user from database
    const result = await dynamoDb.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { email: session.user.email }
    }));

    const user = result.Item;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (isValidPassword) {
      res.status(200).json({ valid: true });
    } else {
      res.status(400).json({ valid: false, message: 'Invalid password' });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
