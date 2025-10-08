import { useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CreateLot({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    borrowerName: '',
    expectedCloseDate: '',
    currency: 'INR',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Something went wrong');
        return;
      }

      router.push(`/lots/${data.lot.id}`);
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link href="/dashboard">
              <button className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
            </Link>
            <div className="ml-2">
              <h1 className="text-xl font-bold text-gray-900">Create New Lot</h1>
              <p className="text-sm text-gray-600">Set up a new financing lot</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Lot Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="input-field"
              placeholder="e.g., Personal Loan - John Doe"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="borrowerName" className="block text-sm font-medium text-gray-700 mb-2">
              Borrower Name *
            </label>
            <input
              id="borrowerName"
              name="borrowerName"
              type="text"
              required
              className="input-field"
              placeholder="Enter borrower's full name"
              value={formData.borrowerName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="input-field resize-none"
              placeholder="Optional description or notes about this lot"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              className="input-field"
              value={formData.currency}
              onChange={handleChange}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Close Date
            </label>
            <input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
              className="input-field"
              value={formData.expectedCloseDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-1">Optional: When you expect to close this lot</p>
          </div>

          <div className="space-y-4 pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mb-2"
            >
              {isLoading ? 'Creating Lot...' : 'Create Lot'}
            </button>
            
            <Link href="/dashboard">
              <button type="button" className="btn-outline w-full">
                Cancel
              </button>
            </Link>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Quick Tips</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use clear, descriptive titles for easy identification</li>
            <li>• Include borrower's full name for proper tracking</li>
            <li>• Set realistic expected close dates</li>
            <li>• You can add transactions immediately after creating the lot</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: session.user,
    },
  };
}
