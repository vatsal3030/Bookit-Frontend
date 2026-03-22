import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { CreditCard, Smartphone, Wallet, Clock, ShieldCheck, Loader2, CheckCircle, XCircle, Calendar, Eye, EyeOff } from 'lucide-react';

const METHODS = [
  { value: 'CARD', label: 'Credit Card', icon: CreditCard },
  { value: 'UPI', label: 'UPI App', icon: Smartphone },
  { value: 'WALLET', label: 'Wallet', icon: Wallet },
  { value: 'PAYLATER', label: 'Pay Later', icon: Clock },
];

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'failed' | null>(null);
  const [showCVC, setShowCVC] = useState(false);

  useEffect(() => {
    const fetchAppt = async () => {
      try { const res = await api.get(`/appointments/${id}`); setAppointment(res.data.appointment); }
      catch { showToast('Appointment not found', 'error'); }
      finally { setLoading(false); }
    };
    if (id) fetchAppt();
  }, [id]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/payments/process', { appointmentId: id, method });
      if (res.data.payment.status === 'SUCCESS') { setResult('success'); showToast('Payment successful!', 'success'); }
      else { setResult('success'); showToast('Payment pending — Pay Later applied.', 'info'); }
    } catch (err: any) { setResult('failed'); showToast(err.response?.data?.error || 'Payment failed', 'error'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  // Result Screen
  if (result) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-xl p-10 max-w-md w-full text-center shadow-sm">
          {result === 'success' ? (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-sm text-gray-500 mb-5">Your appointment has been confirmed. You'll receive a notification shortly.</p>
              {appointment && (
                <div className="bg-gray-50 rounded-lg p-4 mb-5 text-left text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="text-gray-900">{appointment.service?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="text-blue-600 font-bold">₹{appointment.amount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Confirmation</span><span className="text-gray-900 font-mono text-xs">{appointment.confirmationNo}</span></div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-sm text-gray-500 mb-5">The payment could not be processed. Please try again or use a different method.</p>
            </>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="primary" onClick={() => navigate('/dashboard/appointments')}>View Appointments</Button>
            {result === 'failed' && <Button variant="outline" onClick={() => setResult(null)}>Try Again</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Secure Checkout</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Complete your booking securely</p>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {/* Order Summary */}
          {appointment && (
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">{appointment.service?.name}</span><span className="text-gray-900">₹{appointment.service?.baseFee || appointment.amount}</span></div>
                {appointment.service?.tax > 0 && <div className="flex justify-between"><span className="text-gray-400">Tax</span><span className="text-gray-600">₹{appointment.service.tax}</span></div>}
                <div className="flex justify-between"><span className="text-gray-400">Platform Fee (2%)</span><span className="text-gray-600">₹{Math.ceil(appointment.amount * 0.02)}</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-medium text-gray-900">Total</span><span className="text-xl font-bold text-blue-600">₹{appointment.amount + Math.ceil(appointment.amount * 0.02)}</span></div>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(appointment.timeSlot?.date || appointment.createdAt).toLocaleDateString()}</span>
                <span>Provider: {appointment.provider?.user?.name}</span>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {METHODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${method === m.value ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <m.icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Card Details */}
          {method === 'CARD' && (
            <div className="space-y-3 mb-6">
              <Input placeholder="Card Number (4242 4242 4242 4242)" />
              <div className="flex gap-3">
                <Input placeholder="MM/YY" className="w-1/2" />
                <div className="relative w-1/2">
                  <Input placeholder="CVC" type={showCVC ? 'text' : 'password'} className="w-full pr-10" />
                  <button type="button" onClick={() => setShowCVC(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCVC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Input placeholder="Cardholder Name" />
            </div>
          )}
          {method === 'UPI' && <div className="mb-6"><Input placeholder="UPI ID (e.g., user@paytm)" /></div>}

          <Button variant="primary" className="w-full h-12 text-base" onClick={handlePayment} loading={processing}>
            <ShieldCheck className="w-5 h-5" />
            {method === 'PAYLATER' ? 'Confirm Pay Later' : `Pay ₹${appointment ? appointment.amount + Math.ceil(appointment.amount * 0.02) : 0} Securely`}
          </Button>
          <p className="mt-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Your payment information is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}
