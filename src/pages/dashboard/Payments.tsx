import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Receipt, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

export default function Payments() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await api.get('/payments/my-payments');
        setPayments(data.payments);
      } catch (err: any) {
        showToast('Failed to load payment history', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [showToast]);

  const isCustomer = user?.role === 'CUSTOMER';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage your past transactions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Invoice</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{isCustomer ? 'Provider' : 'Customer'}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 mb-2"/><div className="h-3 bg-gray-100 rounded w-16"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"/></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"/></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"/></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>No payments found.</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 mb-1">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(payment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{payment.invoiceNo || payment.transactionNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.appointment.service.name}</div>
                      <div className="text-xs text-gray-500">{payment.method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isCustomer 
                          ? payment.appointment.provider.user.name 
                          : payment.appointment.customer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₹{payment.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent", getStatusColor(payment.status))}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}
