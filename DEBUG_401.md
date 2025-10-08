# 🔍 Debug 401 Error - Step by Step

## Immediate Actions:

### 1. Test Basic Connectivity
Visit this URL to check if your environment is set up correctly:
```
https://finance-psi-flame.vercel.app/api/test-auth
```

This will show you:
- ✅/❌ Environment variables status
- ✅/❌ DynamoDB connection
- 👥 Number of users in database

### 2. Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on any function (like `api/auth/[...nextauth]`)
3. Check the logs for error messages

### 3. Verify Environment Variables in Vercel
Go to Vercel Dashboard → Settings → Environment Variables and ensure:

```env
NEXTAUTH_URL=https://finance-psi-flame.vercel.app
NEXTAUTH_SECRET=[32+ character secret]
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[your-key]
AWS_SECRET_ACCESS_KEY=[your-secret]
DYNAMODB_USERS_TABLE=financing-lots-users
DYNAMODB_LOTS_TABLE=financing-lots-lots
DYNAMODB_TRANSACTIONS_TABLE=financing-lots-transactions
```

### 4. Common 401 Causes:

#### A. Missing/Wrong NEXTAUTH_SECRET
- Must be 32+ characters
- Generate new one: `openssl rand -base64 32`

#### B. Wrong NEXTAUTH_URL
- Must match your exact domain
- Include `https://`
- No trailing slash

#### C. DynamoDB Issues
- AWS credentials incorrect
- Tables don't exist
- Wrong region

#### D. No Users in Database
- You need to register at least one user
- Try visiting `/register` first

### 5. Test Registration First
Before testing login, try:
1. Visit: `https://finance-psi-flame.vercel.app/register`
2. Create a test account
3. Check if registration works
4. Then try login

### 6. Check Browser Network Tab
1. Open browser dev tools (F12)
2. Go to Network tab
3. Try to login
4. Look for failed requests
5. Check response details

## Expected Log Output:

When you try to login, you should see logs like:
```
🔧 Environment check: { AWS_REGION: true, AWS_ACCESS_KEY_ID: true, ... }
📊 Using DynamoDB tables: { USERS: 'financing-lots-users', ... }
🔐 NextAuth authorize called with: { email: 'test@example.com' }
🔍 Attempting DynamoDB connection...
📋 DynamoDB query result: { found: true }
🔑 Password validation: { valid: true }
✅ Authentication successful for: test@example.com
```

## If Still Getting 401:

### Quick Fixes:
1. **Redeploy** after setting environment variables
2. **Clear browser cache** and cookies
3. **Try incognito/private mode**
4. **Check exact domain** in NEXTAUTH_URL

### Advanced Debugging:
1. Enable NextAuth debug mode temporarily
2. Check Vercel function timeout settings
3. Verify DynamoDB table permissions
4. Test with a fresh user registration

## Contact Points:
- Check `/api/test-auth` endpoint first
- Look at Vercel function logs
- Verify environment variables are set
- Test registration before login
