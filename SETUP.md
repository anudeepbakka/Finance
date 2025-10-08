# 🚀 Quick Setup Guide

Follow these steps to get your Financing Lots app running:

## 1. 📋 Prerequisites

- Node.js 18+ installed
- AWS Account (free tier is sufficient)

## 2. 🔑 Get AWS Credentials

### Step 2.1: Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/console/)
2. Sign up for a free account if you don't have one

### Step 2.2: Create IAM User
1. Go to **IAM Console** → **Users** → **Create User**
2. Enter username (e.g., `financing-lots-user`)
3. Select **Programmatic access**
4. Click **Next: Permissions**

### Step 2.3: Attach Permissions
1. Click **Attach existing policies directly**
2. Search for and select: `AmazonDynamoDBFullAccess`
3. Click **Next** → **Create User**
4. **IMPORTANT**: Copy and save the **Access Key ID** and **Secret Access Key**

## 3. 🔧 Configure Environment

### Step 3.1: Create Environment File
Create a file named `.env.local` in your project root:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here

# DynamoDB Table Names (keep these as default)
DYNAMODB_USERS_TABLE=financing-lots-users
DYNAMODB_LOTS_TABLE=financing-lots-lots
DYNAMODB_TRANSACTIONS_TABLE=financing-lots-transactions
```

### Step 3.2: Replace Placeholder Values
- Replace `your-aws-access-key-id-here` with your actual Access Key ID
- Replace `your-aws-secret-access-key-here` with your actual Secret Access Key
- Generate a random secret for `NEXTAUTH_SECRET` (at least 32 characters)

## 4. 🗄️ Setup Database

Run the database setup script:

```bash
npm run setup-db
```

This will create the required DynamoDB tables in your AWS account.

## 5. 🎉 Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 6. 🎯 First Steps

1. **Register**: Create your first account
2. **Create Lot**: Set up your first financing lot
3. **Add Transactions**: Start tracking money in/out
4. **Monitor**: Watch your balance and profit/loss

## 🔧 Troubleshooting

### "Invalid security token" error
- Double-check your AWS credentials in `.env.local`
- Ensure the IAM user has DynamoDB permissions
- Verify there are no extra spaces in your credentials

### "Access denied" error
- Make sure your IAM user has `AmazonDynamoDBFullAccess` policy
- Check that your AWS region is correct

### Tables already exist
- This is normal if you've run the setup before
- The script will skip existing tables

### Environment variables not found
- Ensure `.env.local` file exists in the project root
- Check that variable names match exactly (case-sensitive)
- Restart your terminal after creating the file

## 💡 Tips

- Keep your AWS credentials secure and never commit them to version control
- The free tier includes 25GB of DynamoDB storage - more than enough for personal use
- You can view your tables in the AWS Console under DynamoDB
- The app is mobile-first but works great on desktop too!

## 🆘 Need Help?

If you run into issues:
1. Check the error messages carefully
2. Verify all environment variables are set correctly
3. Ensure your AWS credentials have the right permissions
4. Try running `npm run setup-db` again after fixing any issues

---

**Ready to start managing your financing lots! 💰**
