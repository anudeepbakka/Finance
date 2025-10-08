import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function LotDetails({ initialData, user }) {
  const [data, setData] = useState(initialData);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { lotId } = router.query;

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/lots/${lotId}`);
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const closeLot = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lots/${lotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'close' }),
      });

      if (response.ok) {
        await refreshData();
        setShowCloseConfirm(false);
      }
    } catch (error) {
      console.error('Error closing lot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPasswordAndExecute = async (password, action) => {
    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();
      
      if (result.valid) {
        setShowPasswordModal(false);
        await executeAction(action);
      } else {
        throw new Error('Invalid password');
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      throw error;
    }
  };

  const executeAction = async (action) => {
    if (action.type === 'delete') {
      await deleteLot();
    } else if (action.type === 'edit') {
      await updateLot(action.data);
    }
  };

  const deleteLot = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lots/${lotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete lot');
      }
    } catch (error) {
      console.error('Error deleting lot:', error);
      alert('Failed to delete lot');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLot = async (formData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/lots/${lotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'edit', ...formData }),
      });

      if (response.ok) {
        await refreshData();
        setShowEditForm(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update lot');
      }
    } catch (error) {
      console.error('Error updating lot:', error);
      alert('Failed to update lot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    setPendingAction({ type: 'edit' });
    setShowPasswordModal(true);
  };

  const handleDeleteClick = () => {
    setPendingAction({ type: 'delete' });
    setShowPasswordModal(true);
  };

  const { lot, transactions = [], summary } = data;
  const balance = summary?.balance || 0;
  const isPositive = balance >= 0;

  const AddTransactionForm = () => {
    const [formData, setFormData] = useState({
      amount: '',
      paymentType: 'UPI',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [slidePosition, setSlidePosition] = useState(0); // -1 to 1, 0 is center
    const [isSliding, setIsSliding] = useState(false);


    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    // Handle touch events for swipe gestures
    const handleTouchStart = (e) => {
      e.preventDefault(); // Prevent page scroll
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
      setIsSliding(true);
      setSlidePosition(0);
    };

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent page scroll
      if (!touchStart) return;
      
      const currentTouch = e.targetTouches[0].clientX;
      setTouchEnd(currentTouch);
      
      // Calculate slide position (-1 to 1)
      const distance = currentTouch - touchStart;
      const maxDistance = 150; // Maximum slide distance
      const position = Math.max(-1, Math.min(1, distance / maxDistance));
      setSlidePosition(position);
    };

    const handleTouchEnd = (e) => {
      e.preventDefault(); // Prevent page scroll
      setIsSliding(false);
      
      if (!touchStart || !touchEnd) {
        setSlidePosition(0);
        return;
      }
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) {
        // Swipe left = Money IN
        saveTransaction('IN');
      } else if (isRightSwipe) {
        // Swipe right = Money OUT
        saveTransaction('OUT');
      }
      
      // Reset position
      setSlidePosition(0);
    };

    const saveTransaction = async (type) => {
      if (!formData.amount) {
        alert('Please enter an amount');
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            type,
            lotId,
          }),
        });

        if (response.ok) {
          await refreshData();
          // Show success message
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
          
          // Reset form but keep payment method and date
          setFormData({
            amount: '',
            paymentType: formData.paymentType,
            date: new Date().toISOString().split('T')[0],
            description: '',
          });
        }
      } catch (error) {
        console.error('Error adding transaction:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, []);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 overscroll-none">
        <div className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 max-h-[90vh] overflow-y-auto overscroll-contain">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add Transaction</h3>
            <button
              onClick={() => setShowAddTransaction(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Transaction added successfully!
              </div>
            )}

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                className="input-field"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type *
              </label>
              <select
                id="paymentType"
                name="paymentType"
                className="input-field"
                value={formData.paymentType}
                onChange={handleChange}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="GST">GST</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                className="input-field"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                id="description"
                name="description"
                type="text"
                className="input-field"
                placeholder="Optional description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Slide to Save */}
            <div className="space-y-3 pt-6">
              <div className="relative">
                <div 
                  className={`relative rounded-full h-14 flex items-center overflow-hidden transition-colors duration-200 touch-none select-none ${
                    slidePosition < -0.3 ? 'bg-green-200' : 
                    slidePosition > 0.3 ? 'bg-red-200' : 
                    'bg-gray-200'
                  }`}
                  style={{ touchAction: 'none' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={(e) => handleTouchStart({ preventDefault: () => {}, targetTouches: [{ clientX: e.clientX }] })}
                  onMouseMove={(e) => isSliding && handleTouchMove({ preventDefault: () => {}, targetTouches: [{ clientX: e.clientX }] })}
                  onMouseUp={(e) => handleTouchEnd({ preventDefault: () => {} })}
                  onMouseLeave={(e) => handleTouchEnd({ preventDefault: () => {} })}
                >
                  {/* Sliding Circle */}
                  <div 
                    className="absolute flex items-center justify-center z-20 transition-transform duration-100"
                    style={{
                      left: '50%',
                      transform: `translateX(calc(-50% + ${slidePosition * 100}px))`,
                    }}
                  >
                    <div className={`rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 transition-colors duration-200 ${
                      slidePosition < -0.3 ? 'bg-green-500 border-green-600 text-white' :
                      slidePosition > 0.3 ? 'bg-red-500 border-red-600 text-white' :
                      'bg-white border-gray-300 text-gray-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d={slidePosition < -0.3 ? "M7 16l-4-4m0 0l4-4m-4 4h18" : 
                             slidePosition > 0.3 ? "M17 8l4 4m0 0l-4 4m4-4H3" :
                             "M7 16l-4-4m0 0l4-4m-4 4h18"} />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Left Side - Money IN */}
                  <div className={`w-1/2 h-full flex items-center justify-start pl-4 font-medium transition-colors duration-200 ${
                    slidePosition < -0.3 ? 'text-green-800' : 'text-green-600'
                  }`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Money IN
                  </div>
                  
                  {/* Right Side - Money OUT */}
                  <div className={`w-1/2 h-full flex items-center justify-end pr-4 font-medium transition-colors duration-200 ${
                    slidePosition > 0.3 ? 'text-red-800' : 'text-red-600'
                  }`}>
                    Money OUT
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                
                {/* Helper Text */}
                <div className="text-center text-xs text-gray-500 mt-2">
                  Slide left to save as Money IN • Slide right to save as Money OUT
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    // Reset form and keep modal open for another transaction
                    setFormData({
                      amount: '',
                      paymentType: 'UPI',
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                    });
                  }}
                  className="btn-outline flex-1"
                >
                  Clear Form
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="btn-secondary flex-1"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CloseConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Close Lot</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to close this lot? This action cannot be undone and will generate a final analytics report.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={closeLot}
            disabled={isLoading}
            className="btn-accent flex-1"
          >
            {isLoading ? 'Closing...' : 'Yes, Close Lot'}
          </button>
          <button
            onClick={() => setShowCloseConfirm(false)}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const PasswordModal = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsVerifying(true);
      setError('');

      try {
        await verifyPasswordAndExecute(password, pendingAction);
        setPassword('');
        if (pendingAction.type === 'edit') {
          setShowEditForm(true);
        }
      } catch (error) {
        setError('Invalid password. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Confirm {pendingAction?.type === 'delete' ? 'Delete' : 'Edit'}
          </h3>
          <p className="text-gray-600 mb-4">
            {pendingAction?.type === 'delete' 
              ? 'Please enter your password to permanently delete this lot and all its transactions. This action cannot be undone.'
              : 'Please enter your password to edit this lot.'
            }
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              autoFocus
            />
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isVerifying}
                className="btn-primary flex-1"
              >
                {isVerifying ? 'Verifying...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setError('');
                  setPendingAction(null);
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EditForm = () => {
    const [formData, setFormData] = useState({
      title: lot.title || '',
      description: lot.description || '',
      borrowerName: lot.borrowerName || '',
      expectedCloseDate: lot.expectedCloseDate || '',
      currency: lot.currency || 'INR',
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setPendingAction({ type: 'edit', data: formData });
      await updateLot(formData);
    };

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
        <div className="bg-white w-full max-w-md mx-auto rounded-t-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Lot</h3>
            <button
              onClick={() => setShowEditForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex-1"
              >
                {isLoading ? 'Updating...' : 'Update Lot'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!lot) {
    return <div>Loading...</div>;
  }

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
            <div className="ml-2 flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">{lot.title}</h1>
              <p className="text-sm text-gray-600">Lot Details</p>
            </div>
            {lot.closed ? (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-3 py-1 rounded-full">
                Closed
              </span>
            ) : summary?.isClosable ? (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                <CheckBadgeIcon className="w-3 h-3 mr-1" />
                Closable
              </span>
            ) : (
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Lot Info */}
        <div className="card">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="w-4 h-4 mr-2" />
              <span className="font-medium">{lot.borrowerName}</span>
            </div>
            
            {lot.description && (
              <p className="text-sm text-gray-700">{lot.description}</p>
            )}
            
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Created: {format(new Date(lot.createdAt), 'MMM dd, yyyy')}</span>
            </div>
            
            {lot.lastEditedAt && (
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>Last edited: {format(new Date(lot.lastEditedAt), 'MMM dd, yyyy \'at\' HH:mm')}</span>
              </div>
            )}
            
            {lot.expectedCloseDate && (
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>Expected Close: {format(new Date(lot.expectedCloseDate), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Balance Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Money In:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(summary?.moneyIn || 0, lot.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Money Out:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(summary?.moneyOut || 0, lot.currency)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Current Balance:</span>
              <span className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance, lot.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!lot.closed && (
            <>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="btn-primary w-full flex items-center justify-center"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Transaction
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleEditClick}
                  className="btn-outline flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Lot
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="btn-danger"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
              
              {summary?.isClosable && (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="btn-accent w-full flex items-center justify-center"
                >
                  <CheckBadgeIcon className="w-5 h-5 mr-2" />
                  Close Lot
                </button>
              )}
            </>
          )}
          
          {lot.closed && (
            <button
              onClick={handleDeleteClick}
              className="btn-danger w-full flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Closed Lot
            </button>
          )}
        </div>

        {/* Analytics (for closed lots) */}
        {lot.closed && lot.analytics && (
          <div className="card">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="w-5 h-5 mr-2 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Final Analytics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Profit:</span>
                <div className={`font-semibold ${lot.analytics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(lot.analytics.profit, lot.currency)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">IN Transactions:</span>
                <div className="font-semibold">{lot.analytics.numInTransactions}</div>
              </div>
              <div>
                <span className="text-gray-600">OUT Transactions:</span>
                <div className="font-semibold">{lot.analytics.numOutTransactions}</div>
              </div>
              <div>
                <span className="text-gray-600">Avg IN Amount:</span>
                <div className="font-semibold">
                  {formatCurrency(lot.analytics.avgInAmount, lot.currency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
            <span className="text-sm text-gray-600">{transactions.length} total</span>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CurrencyRupeeIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'IN' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                      <span className="text-xs text-gray-500">{transaction.paymentType}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </div>
                    {transaction.description && (
                      <div className="text-xs text-gray-500 mt-1">{transaction.description}</div>
                    )}
                  </div>
                  <div className={`font-semibold ${
                    transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'IN' ? '+' : '-'}{formatCurrency(transaction.amount, lot.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddTransaction && <AddTransactionForm />}
      {showCloseConfirm && <CloseConfirmModal />}
      {showPasswordModal && <PasswordModal />}
      {showEditForm && <EditForm />}
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

  const { lotId } = context.params;

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/lots/${lotId}`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });

    if (!response.ok) {
      return {
        notFound: true,
      };
    }

    const data = await response.json();

    return {
      props: {
        initialData: data,
        user: session.user,
      },
    };
  } catch (error) {
    console.error('Error fetching lot:', error);
    return {
      notFound: true,
    };
  }
}
