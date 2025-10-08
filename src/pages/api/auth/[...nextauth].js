import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dynamoDb, TABLES } from '@/lib/dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 NextAuth authorize called with:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          console.log('🔍 Attempting DynamoDB connection...');
          console.log('📊 Using table:', TABLES.USERS);
          
          // Get user from DynamoDB
          console.log('🔍 Looking up user with email:', credentials.email);
          const result = await dynamoDb.send(new GetCommand({
            TableName: TABLES.USERS,
            Key: { email: credentials.email } // Users table uses 'email' as primary key
          }));

          console.log('📋 DynamoDB query result:', { found: !!result.Item });

          const user = result.Item;
          if (!user) {
            console.log('❌ User not found in database');
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          console.log('🔑 Password validation:', { valid: isValidPassword });
          
          if (!isValidPassword) {
            console.log('❌ Invalid password');
            return null;
          }

          console.log('✅ Authentication successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error('💥 Auth error details:', {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            stack: error.stack
          });
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('🎫 JWT callback:', { hasUser: !!user, hasToken: !!token, hasAccount: !!account });
      if (user) {
        token.id = user.id;
        console.log('✅ JWT token updated with user ID:', user.id);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('👤 Session callback:', { hasSession: !!session, hasToken: !!token });
      if (token && session.user) {
        session.user.id = token.id;
        console.log('✅ Session updated with user ID:', token.id);
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('🚪 SignIn callback:', { hasUser: !!user, provider: account?.provider });
      return true;
    },
  },
};

export default NextAuth(authOptions);
