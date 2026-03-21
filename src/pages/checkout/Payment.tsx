import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { CreditCard, Smartphone, Wallet, Clock, ShieldCheck, Loader2, CheckCircle, XCircle, Calendar } from 'lucide-react';

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

  // Fetch appointment details
  useEffect(() => {
    const fetchAppt = async () => {
      try {
        const res = await api.get(`/appointments/${id}`);
        setAppointment(res.data.appointment);
      } catch {
        showToast('Appointment not found', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAppt();
  }, [id]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/payments/process', { appointmentId: id, method });
      if (res.data.payment.status === 'SUCCESS') {
        setResult('success');
        showToast('Payment successful!', 'success');
      } else {
        setResult('success'); // Pay Later is also "success" from the user's perspective
        showToast('Payment pending — Pay Later applied.', 'info');
      }
    } catch (err: any) {
      setResult('failed');
      showToast(err.response?.data?.error || 'Payment failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[85vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // Success / Failed Result Screen
  if (result) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-10 max-w-md w-full text-center">
          {result === 'success' ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-gray-400 mb-6">Your appointment has been confirmed. You'll receive a notification shortly.</p>
              {appointment && (
                <div className="glass-card p-4 mb-6 text-left text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400">Service</span><span className="text-white">{appointment.service?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-blue-400 font-bold">₹{appointment.amount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Confirmation</span><span className="text-white font-mono text-xs">{appointment.confirmationNo}</span></div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-gray-400 mb-6">The payment could not be processed. Please try again or use a different payment method.</p>
            </>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/dashboard/appointments')}>View Appointments</Button>
            {result === 'failed' && (
              <Button variant="glass" onClick={() => setResult(null)}>Try Again</Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-white">Secure Checkout</h1>
        <p className="text-gray-400 text-center mb-8">Complete your booking securely</p>

        <div className="glass-panel p-6">
          {/* Order Summary */}
          {appointment && (
            <div className="mb-6 pb-6 border-b border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">{appointment.service?.name}</span>
                  <span className="text-white">₹{appointment.service?.baseFee || appointment.amount}</span>
                </div>
                {appointment.service?.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tax</span>
                    <span className="text-gray-300">₹{appointment.service.tax}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-2xl font-bold text-blue-400">₹{appointment.amount}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(appointment.timeSlot?.date || appointment.createdAt).toLocaleDateString()}</span>
                <span>Provider: {appointment.provider?.user?.name}</span>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <h3 className="text-sm font-medium text-gray-400 mb-3">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {METHODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  method === m.value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <m.icon className="w-7 h-7 mb-2" />
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Card Details (only for CARD) */}
          {method === 'CARD' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 mb-6">
              <Input placeholder="Card Number (4242 4242 4242 4242)" />
              <div className="flex gap-3">
                <Input placeholder="MM/YY" className="w-1/2" />
                <Input placeholder="CVC" type="password" className="w-1/2" />
              </div>
              <Input placeholder="Cardholder Name" />
            </motion.div>
          )}

          {/* UPI Details */}
          {method === 'UPI' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
              <Input placeholder="UPI ID (e.g., user@paytm)" />
            </motion.div>
          )}

          {/* Pay Button */}
          <Button
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden group"
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                {method === 'PAYLATER' ? 'Confirm Pay Later' : `Pay ₹${appointment?.amount || 0} Securely`}
              </>
            )}
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>

          <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Your payment information is encrypted and secure
          </p>
        </div>
      </motion.div>
    </div>
  );
}
