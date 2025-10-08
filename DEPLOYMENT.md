# 🚀 Deployment Guide

## Environment Variables for Production

Set these in your Vercel dashboard (Settings → Environment Variables):

### Required Environment Variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret-key-32-chars-minimum

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# DynamoDB Table Names
DYNAMODB_USERS_TABLE=financing-lots-users-prod
DYNAMODB_LOTS_TABLE=financing-lots-lots-prod
DYNAMODB_TRANSACTIONS_TABLE=financing-lots-transactions-prod
```

## 🔧 Steps to Fix Current Error:

### 1. Update Environment Variables in Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update these variables:

**NEXTAUTH_URL**: `https://finance-psi-flame.vercel.app` (your actual domain)
**NEXTAUTH_SECRET**: Generate a new 32+ character secret:
```bash
openssl rand -base64 32
```

### 2. Generate New NEXTAUTH_SECRET:
Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Update DynamoDB Table Names:
Use different table names for production to avoid conflicts:
- `financing-lots-users-prod`
- `financing-lots-lots-prod` 
- `financing-lots-transactions-prod`

### 4. Create Production DynamoDB Tables:
Run the setup script with production environment variables:
```bash
# Set production env vars temporarily
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export DYNAMODB_USERS_TABLE=financing-lots-users-prod
export DYNAMODB_LOTS_TABLE=financing-lots-lots-prod
export DYNAMODB_TRANSACTIONS_TABLE=financing-lots-transactions-prod

# Run setup
node scripts/setup-dynamodb.js
```

### 5. Redeploy:
After updating environment variables, trigger a new deployment:
- Push a small change to your repository, OR
- Go to Vercel dashboard → Deployments → Redeploy

## 🔍 Common Issues:

### CredentialsSignin Error:
- Usually caused by incorrect NEXTAUTH_URL or NEXTAUTH_SECRET
- Make sure NEXTAUTH_URL matches your exact domain (with https://)
- Ensure NEXTAUTH_SECRET is at least 32 characters

### DynamoDB Connection Issues:
- Verify AWS credentials are correct
- Check that DynamoDB tables exist in the specified region
- Ensure IAM user has DynamoDB permissions

### 404 Errors:
- Make sure all API routes are properly deployed
- Check that file paths are correct (case-sensitive)

## 🎯 Quick Fix Checklist:

- [ ] Set correct NEXTAUTH_URL in Vercel
- [ ] Generate and set strong NEXTAUTH_SECRET
- [ ] Verify AWS credentials in Vercel
- [ ] Create production DynamoDB tables
- [ ] Redeploy the application
- [ ] Test login functionality

## 🆘 If Still Having Issues:

1. Check Vercel function logs for detailed errors
2. Enable NextAuth debug mode temporarily
3. Verify all environment variables are set correctly
4. Test DynamoDB connection separately
