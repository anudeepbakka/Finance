import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { Transaction } from '@/lib/models';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { lotId, amount, type, paymentType, date, description } = req.body;

    if (!lotId || !amount || !type || !paymentType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ message: 'Type must be IN or OUT' });
    }

    if (!['UPI', 'Cash', 'GST'].includes(paymentType)) {
      return res.status(400).json({ message: 'Payment type must be UPI, Cash, or GST' });
    }

    try {
      // Verify lot exists and belongs to user
      const lotResult = await dynamoDb.send(new GetCommand({
        TableName: TABLES.LOTS,
        Key: { id: lotId }
      }));

      const lot = lotResult.Item;
      if (!lot || lot.userId !== session.user.id) {
        return res.status(404).json({ message: 'Lot not found' });
      }

      if (lot.closed) {
        return res.status(400).json({ message: 'Cannot add transactions to closed lot' });
      }

      const transaction = new Transaction({
        lotId,
        userId: session.user.id,
        amount: parseFloat(amount),
        type,
        paymentType,
        date: date || new Date().toISOString(),
        description,
      });

      await dynamoDb.send(new PutCommand({
        TableName: TABLES.TRANSACTIONS,
        Item: transaction.toItem()
      }));

      res.status(201).json({ transaction: transaction.toItem() });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
