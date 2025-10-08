# Financing Lots - Mobile-First Web App

A mobile-first web application for managing financing "lots" where you lend money in pieces and receive pieces back with profit tracking. Built with Next.js, Tailwind CSS, NextAuth.js, and AWS DynamoDB.

## 🌟 Features

- **Mobile-First Design**: Optimized for iPhone 14 Plus viewport (428px) with responsive design
- **Lot Management**: Create, view, and close financing lots
- **Transaction Tracking**: Add IN/OUT transactions with UPI/Cash/GST payment types
- **Real-time Balance**: Color-coded balance display (green for profit, red for loss)
- **Analytics**: Comprehensive analytics when closing lots
- **Secure Authentication**: Email/password login with bcrypt hashing
- **Server-Side Rendering**: Fast page loads with Next.js SSR

## 🎨 Design

- **Colors**: Bold and cheerful palette (teal, purple, coral)
- **Mobile-First**: Single-column layout with large touch targets
- **Responsive**: Works across different screen sizes
- **Modern UI**: Clean cards, smooth transitions, and intuitive navigation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with JavaScript
- **Styling**: Tailwind CSS with custom mobile-first configuration
- **Authentication**: NextAuth.js with Credentials provider
- **Database**: AWS DynamoDB with AWS SDK v3
- **Icons**: Heroicons
- **Date Handling**: date-fns
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

- Node.js 18+
- AWS Account (free tier)
- npm/yarn/pnpm

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd financing-lots
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# DynamoDB Table Names
DYNAMODB_USERS_TABLE=financing-lots-users
DYNAMODB_LOTS_TABLE=financing-lots-lots
DYNAMODB_TRANSACTIONS_TABLE=financing-lots-transactions
```

### 3. AWS Setup

1. **Create AWS Account**: Sign up for AWS free tier
2. **Create IAM User**: 
   - Go to IAM Console
   - Create a new user with programmatic access
   - Attach `AmazonDynamoDBFullAccess` policy
   - Save the Access Key ID and Secret Access Key
3. **Update Environment Variables**: Add your AWS credentials to `.env.local`

### 4. Database Setup

Run the DynamoDB setup script:

```bash
node scripts/setup-dynamodb.js
```

This will create three tables:
- `financing-lots-users` - User accounts
- `financing-lots-lots` - Financing lots
- `financing-lots-transactions` - Transaction records

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 📱 Usage Guide

### Getting Started

1. **Register**: Create a new account with email and password
2. **Login**: Sign in to access your dashboard
3. **Create Lot**: Click "Create New Lot" to set up your first financing lot
4. **Add Transactions**: Add IN/OUT transactions to track money flow
5. **Monitor Balance**: Watch real-time balance updates with color coding
6. **Close Lot**: When ready, close the lot to generate analytics

### Key Features

#### Lot Management
- Create lots with borrower information
- Set expected close dates
- Track multiple currencies (INR, USD, EUR, GBP)

#### Transaction Tracking
- **IN Transactions**: Money you receive back
- **OUT Transactions**: Money you lend out
- **Payment Types**: UPI, Cash, or GST
- **Automatic Dating**: Defaults to today, editable

#### Smart Balance Display
- **Green**: When Money IN ≥ Money OUT (profitable/breakeven)
- **Red**: When Money OUT > Money IN (at loss)
- **Closable Badge**: Shows when lot can be closed

#### Analytics (Closed Lots)
- Total profit/loss calculation
- Transaction count breakdown
- Average transaction amounts
- Timeline visualization

## 🏗️ Project Structure

```
financing-lots/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles and Tailwind components
│   │   └── layout.js            # Root layout component
│   ├── lib/
│   │   ├── dynamodb.js          # DynamoDB client configuration
│   │   └── models.js            # Data models (User, Lot, Transaction)
│   └── pages/
│       ├── api/
│       │   ├── auth/
│       │   │   ├── [...nextauth].js    # NextAuth configuration
│       │   │   └── register.js         # User registration endpoint
│       │   ├── lots/
│       │   │   ├── index.js            # Lots CRUD operations
│       │   │   └── [lotId].js          # Individual lot operations
│       │   └── transactions/
│       │       └── index.js            # Transaction operations
│       ├── lots/
│       │   ├── create.js               # Create new lot page
│       │   └── [lotId].js             # Lot details page
│       ├── _app.js                     # App wrapper with SessionProvider
│       ├── index.js                    # Home page (redirects)
│       ├── login.js                    # Login page
│       ├── register.js                 # Registration page
│       └── dashboard.js                # Main dashboard
├── scripts/
│   └── setup-dynamodb.js       # Database setup script
├── package.json
├── tailwind.config.js          # Tailwind configuration
└── next.config.js              # Next.js configuration
```

## 🎯 Business Rules

1. **Money Calculation**: 
   - Money In = Sum of all IN transactions
   - Money Out = Sum of all OUT transactions
   - Balance = Money In - Money Out

2. **Lot Closing**: 
   - Lots can be closed when Money In ≥ Money Out
   - Closing generates final analytics snapshot
   - Closed lots cannot be modified

3. **Transaction Requirements**:
   - Amount, type (IN/OUT), and payment type (UPI/Cash/GST) are required
   - Date defaults to current date but can be modified
   - Description is optional

4. **Color Coding**:
   - Green: Profitable or breakeven (Money In ≥ Money Out)
   - Red: At loss (Money Out > Money In)

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Import your GitHub repository to Vercel
2. **Environment Variables**: Add all environment variables from `.env.local`
3. **Deploy**: Vercel will automatically build and deploy your app

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
DYNAMODB_USERS_TABLE=financing-lots-users-prod
DYNAMODB_LOTS_TABLE=financing-lots-lots-prod
DYNAMODB_TRANSACTIONS_TABLE=financing-lots-transactions-prod
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New API Endpoints**: Add to `src/pages/api/`
2. **New Pages**: Add to `src/pages/`
3. **Components**: Create in `src/components/` (if needed)
4. **Styling**: Use Tailwind classes, custom components in `globals.css`

## 🐛 Troubleshooting

### Common Issues

1. **DynamoDB Connection Issues**:
   - Verify AWS credentials in `.env.local`
   - Check AWS region setting
   - Ensure IAM user has DynamoDB permissions

2. **NextAuth Issues**:
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain

3. **Build Errors**:
   - Run `npm run lint` to check for syntax errors
   - Ensure all dependencies are installed

### Getting Help

- Check the browser console for error messages
- Verify environment variables are set correctly
- Ensure DynamoDB tables are created successfully

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy financing! 💰**
