import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { lotId } = req.query;

  if (req.method === 'GET') {
    // Get lot details with transactions
    try {
      // Get lot
      const lotResult = await dynamoDb.send(new GetCommand({
        TableName: TABLES.LOTS,
        Key: { id: lotId }
      }));

      const lot = lotResult.Item;
      if (!lot || lot.userId !== session.user.id) {
        return res.status(404).json({ message: 'Lot not found' });
      }

      // Get transactions for this lot
      const transactionsResult = await dynamoDb.send(new QueryCommand({
        TableName: TABLES.TRANSACTIONS,
        IndexName: 'LotIdIndex', // You'll need to create this GSI
        KeyConditionExpression: 'lotId = :lotId',
        ExpressionAttributeValues: {
          ':lotId': lotId
        },
        ScanIndexForward: false // Most recent first
      }));

      const transactions = transactionsResult.Items || [];
      
      // Calculate totals
      const moneyIn = transactions
        .filter(t => t.type === 'IN')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const moneyOut = transactions
        .filter(t => t.type === 'OUT')
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = moneyIn - moneyOut;
      const isClosable = moneyIn >= moneyOut;

      res.status(200).json({ 
        lot, 
        transactions, 
        summary: {
          moneyIn,
          moneyOut,
          balance,
          isClosable
        }
      });
    } catch (error) {
      console.error('Get lot error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    const { action, ...updateData } = req.body;
    
    if (action === 'close') {
      // Close lot
      try {
      // Get current lot
      const lotResult = await dynamoDb.send(new GetCommand({
        TableName: TABLES.LOTS,
        Key: { id: lotId }
      }));

      const lot = lotResult.Item;
      if (!lot || lot.userId !== session.user.id) {
        return res.status(404).json({ message: 'Lot not found' });
      }

      if (lot.closed) {
        return res.status(400).json({ message: 'Lot is already closed' });
      }

      // Get transactions to calculate analytics
      const transactionsResult = await dynamoDb.send(new QueryCommand({
        TableName: TABLES.TRANSACTIONS,
        IndexName: 'LotIdIndex',
        KeyConditionExpression: 'lotId = :lotId',
        ExpressionAttributeValues: {
          ':lotId': lotId
        }
      }));

      const transactions = transactionsResult.Items || [];
      const inTransactions = transactions.filter(t => t.type === 'IN');
      const outTransactions = transactions.filter(t => t.type === 'OUT');
      
      const totalIn = inTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalOut = outTransactions.reduce((sum, t) => sum + t.amount, 0);
      const profit = totalIn - totalOut;
      
      const analytics = {
        totalIn,
        totalOut,
        profit,
        numInTransactions: inTransactions.length,
        numOutTransactions: outTransactions.length,
        avgInAmount: inTransactions.length > 0 ? totalIn / inTransactions.length : 0,
        avgOutAmount: outTransactions.length > 0 ? totalOut / outTransactions.length : 0,
        timeline: transactions.map(t => ({
          date: t.date,
          amount: t.amount,
          type: t.type,
          paymentType: t.paymentType
        }))
      };

      // Update lot
      await dynamoDb.send(new UpdateCommand({
        TableName: TABLES.LOTS,
        Key: { id: lotId },
        UpdateExpression: 'SET closed = :closed, closedAt = :closedAt, analytics = :analytics',
        ExpressionAttributeValues: {
          ':closed': true,
          ':closedAt': new Date().toISOString(),
          ':analytics': analytics
        }
      }));

      res.status(200).json({ message: 'Lot closed successfully', analytics });
    } catch (error) {
      console.error('Close lot error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
    } else if (action === 'edit') {
      // Edit lot
      try {
        const { title, description, borrowerName, expectedCloseDate, currency } = updateData;
        
        // Get current lot to verify ownership
        const lotResult = await dynamoDb.send(new GetCommand({
          TableName: TABLES.LOTS,
          Key: { id: lotId }
        }));

        const lot = lotResult.Item;
        if (!lot || lot.userId !== session.user.id) {
          return res.status(404).json({ message: 'Lot not found' });
        }

        // Note: We allow editing closed lots, but the UI only shows edit for open lots

        // Update lot
        await dynamoDb.send(new UpdateCommand({
          TableName: TABLES.LOTS,
          Key: { id: lotId },
          UpdateExpression: 'SET title = :title, description = :description, borrowerName = :borrowerName, expectedCloseDate = :expectedCloseDate, currency = :currency, lastEditedAt = :lastEditedAt',
          ExpressionAttributeValues: {
            ':title': title,
            ':description': description,
            ':borrowerName': borrowerName,
            ':expectedCloseDate': expectedCloseDate,
            ':currency': currency,
            ':lastEditedAt': new Date().toISOString()
          }
        }));

        res.status(200).json({ message: 'Lot updated successfully' });
      } catch (error) {
        console.error('Edit lot error:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } else if (req.method === 'DELETE') {
    // Delete lot
    try {
      // Get current lot to verify ownership
      const lotResult = await dynamoDb.send(new GetCommand({
        TableName: TABLES.LOTS,
        Key: { id: lotId }
      }));

      const lot = lotResult.Item;
      if (!lot || lot.userId !== session.user.id) {
        return res.status(404).json({ message: 'Lot not found' });
      }

      // Delete all transactions for this lot first
      const transactionsResult = await dynamoDb.send(new QueryCommand({
        TableName: TABLES.TRANSACTIONS,
        IndexName: 'LotIdIndex',
        KeyConditionExpression: 'lotId = :lotId',
        ExpressionAttributeValues: {
          ':lotId': lotId
        }
      }));

      // Delete each transaction
      if (transactionsResult.Items && transactionsResult.Items.length > 0) {
        for (const transaction of transactionsResult.Items) {
          await dynamoDb.send(new DeleteCommand({
            TableName: TABLES.TRANSACTIONS,
            Key: { id: transaction.id }
          }));
        }
      }

      // Delete the lot
      await dynamoDb.send(new DeleteCommand({
        TableName: TABLES.LOTS,
        Key: { id: lotId }
      }));

      res.status(200).json({ message: 'Lot deleted successfully' });
    } catch (error) {
      console.error('Delete lot error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
