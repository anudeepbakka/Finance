// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  waitUntilTableExists 
} = require('@aws-sdk/client-dynamodb');

// Check if environment variables are set
function checkEnvironmentVariables() {
  const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.log(`   • ${varName}`);
    });
    console.log('\n📋 Setup Instructions:');
    console.log('1. Create a .env.local file in your project root');
    console.log('2. Add your AWS credentials:');
    console.log('   AWS_ACCESS_KEY_ID=your-access-key-here');
    console.log('   AWS_SECRET_ACCESS_KEY=your-secret-key-here');
    console.log('   AWS_REGION=us-east-1');
    console.log('\n🔗 How to get AWS credentials:');
    console.log('1. Go to AWS Console → IAM → Users');
    console.log('2. Create a new user with programmatic access');
    console.log('3. Attach "AmazonDynamoDBFullAccess" policy');
    console.log('4. Copy the Access Key ID and Secret Access Key');
    console.log('\n💡 Tip: Make sure to keep your credentials secure!');
    process.exit(1);
  }
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'financing-lots-users',
  LOTS: process.env.DYNAMODB_LOTS_TABLE || 'financing-lots-lots',
  TRANSACTIONS: process.env.DYNAMODB_TRANSACTIONS_TABLE || 'financing-lots-transactions',
};

async function createUsersTable() {
  const params = {
    TableName: TABLES.USERS,
    KeySchema: [
      { AttributeName: 'email', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'email', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${TABLES.USERS}`);
    await waitUntilTableExists({ client }, { TableName: TABLES.USERS });
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️  Table ${TABLES.USERS} already exists`);
    } else {
      throw error;
    }
  }
}

async function createLotsTable() {
  const params = {
    TableName: TABLES.LOTS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${TABLES.LOTS}`);
    await waitUntilTableExists({ client }, { TableName: TABLES.LOTS });
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️  Table ${TABLES.LOTS} already exists`);
    } else {
      throw error;
    }
  }
}

async function createTransactionsTable() {
  const params = {
    TableName: TABLES.TRANSACTIONS,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'lotId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'LotIdIndex',
        KeySchema: [
          { AttributeName: 'lotId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST'
      },
      {
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        BillingMode: 'PAY_PER_REQUEST'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${TABLES.TRANSACTIONS}`);
    await waitUntilTableExists({ client }, { TableName: TABLES.TRANSACTIONS });
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️  Table ${TABLES.TRANSACTIONS} already exists`);
    } else {
      throw error;
    }
  }
}

async function setupDynamoDB() {
  console.log('🚀 Setting up DynamoDB tables...\n');
  
  // Check environment variables first
  checkEnvironmentVariables();
  
  try {
    console.log('🔍 Checking AWS credentials...');
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`   Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'Not set'}`);
    console.log('');
    
    await createUsersTable();
    await createLotsTable();
    await createTransactionsTable();
    
    console.log('\n✅ All tables created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Users table: ${TABLES.USERS}`);
    console.log(`   • Lots table: ${TABLES.LOTS}`);
    console.log(`   • Transactions table: ${TABLES.TRANSACTIONS}`);
    console.log('\n🎉 Your DynamoDB setup is complete!');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Register a new account to get started!');
  } catch (error) {
    console.error('\n❌ Error setting up DynamoDB:');
    
    if (error.name === 'UnrecognizedClientException') {
      console.error('   Invalid AWS credentials. Please check:');
      console.error('   • AWS_ACCESS_KEY_ID is correct');
      console.error('   • AWS_SECRET_ACCESS_KEY is correct');
      console.error('   • Credentials have DynamoDB permissions');
    } else if (error.name === 'AccessDeniedException') {
      console.error('   Access denied. Please ensure your AWS user has:');
      console.error('   • AmazonDynamoDBFullAccess policy attached');
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify your .env.local file exists and has correct values');
    console.error('2. Check AWS IAM user permissions');
    console.error('3. Ensure AWS region is correct');
    
    process.exit(1);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDynamoDB();
}

module.exports = { setupDynamoDB };