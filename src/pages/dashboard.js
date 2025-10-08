import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  PlusIcon, 
  ArrowRightOnRectangleIcon,
  CurrencyRupeeIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function Dashboard({ initialLots, user }) {
  const [lots, setLots] = useState(initialLots || []);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const refreshLots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/lots');
      const data = await response.json();
      setLots(data.lots || []);
    } catch (error) {
      console.error('Error fetching lots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateLotSummary = async (lot) => {
    try {
      const response = await fetch(`/api/lots/${lot.id}`);
      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error calculating summary:', error);
      return { moneyIn: 0, moneyOut: 0, balance: 0, isClosable: false };
    }
  };

  const [lotSummaries, setLotSummaries] = useState({});

  useEffect(() => {
    // Calculate summaries for all lots
    const calculateSummaries = async () => {
      const summaries = {};
      for (const lot of lots) {
        if (!lot.closed) {
          summaries[lot.id] = await calculateLotSummary(lot);
        } else {
          // For closed lots, use stored analytics data
          if (lot.analytics) {
            summaries[lot.id] = {
              moneyIn: lot.analytics.totalIn,
              moneyOut: lot.analytics.totalOut,
              balance: lot.analytics.profit,
              isClosable: false // Already closed
            };
          } else {
            // Fallback: calculate for closed lots without analytics
            summaries[lot.id] = await calculateLotSummary(lot);
          }
        }
      }
      setLotSummaries(summaries);
    };

    if (lots.length > 0) {
      calculateSummaries();
    }
  }, [lots]);

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const LotCard = ({ lot }) => {
    const summary = lotSummaries[lot.id] || { moneyIn: 0, moneyOut: 0, balance: 0, isClosable: false };
    const balance = summary.balance;
    const isPositive = balance >= 0;

    return (
      <Link href={`/lots/${lot.id}`}>
        <div className="lot-card mb-2">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">{lot.title}</h3>
              <p className="text-sm text-gray-600">{lot.borrowerName}</p>
            </div>
            {lot.closed ? (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                Closed
              </span>
            ) : summary.isClosable ? (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                <CheckBadgeIcon className="w-3 h-3 mr-1" />
                Closable
              </span>
            ) : (
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                Active
              </span>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Money In:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(summary.moneyIn, lot.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Money Out:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(summary.moneyOut, lot.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
              <span className="text-gray-700">Balance:</span>
              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(balance, lot.currency)}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between items-center">
              <span>Created: {format(new Date(lot.createdAt), 'MMM dd, yyyy')}</span>
              {lot.expectedCloseDate && (
                <span>Expected: {format(new Date(lot.expectedCloseDate), 'MMM dd')}</span>
              )}
            </div>
            {lot.lastEditedAt && (
              <div className="text-center">
                <span>Last edited: {format(new Date(lot.lastEditedAt), 'MMM dd, yyyy \'at\' HH:mm')}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Quick Actions */}
        <div className="mb-6">
          <Link href="/lots/create">
            <button className="btn-primary w-full flex items-center justify-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Lot
            </button>
          </Link>
        </div>

        {/* Stats Summary */}
        {lots.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-primary-600">
                {lots.filter(lot => !lot.closed).length}
              </div>
              <div className="text-sm text-gray-600">Active Lots</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-gray-600">
                {lots.filter(lot => lot.closed).length}
              </div>
              <div className="text-sm text-gray-600">Closed Lots</div>
            </div>
          </div>
        )}

        {/* Lots List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Your Lots</h2>
            {lots.length > 0 && (
              <button
                onClick={refreshLots}
                disabled={isLoading}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          {lots.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyRupeeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lots yet</h3>
              <p className="text-gray-600 mb-6">Create your first financing lot to get started</p>
              <Link href="/lots/create">
                <button className="btn-primary">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First Lot
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {lots.map((lot) => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  console.log('🏠 Dashboard SSR - checking session...');
  
  const session = await getServerSession(context.req, context.res, authOptions);
  
  console.log('🔍 Dashboard session check:', { 
    hasSession: !!session, 
    userId: session?.user?.id,
    userEmail: session?.user?.email 
  });

  if (!session) {
    console.log('❌ No session found, redirecting to login');
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    // Fetch user's lots
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/lots`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });

    let lots = [];
    if (response.ok) {
      const data = await response.json();
      lots = data.lots || [];
    }

    return {
      props: {
        initialLots: lots,
        user: session.user,
      },
    };
  } catch (error) {
    console.error('Error fetching lots:', error);
    return {
      props: {
        initialLots: [],
        user: session.user,
      },
    };
  }
}
