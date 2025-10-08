import bcrypt from 'bcryptjs';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { User } from '@/lib/models';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user already exists
    const existingUser = await dynamoDb.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { email }
    }));

    if (existingUser.Item) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    // Save to DynamoDB
    await dynamoDb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user.toItem()
    }));

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toItem();
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
