import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { ShieldCheck, Loader2, CheckCircle, XCircle, Calendar } from 'lucide-react';

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'failed' | null>(null);

  useEffect(() => {
    const fetchAppt = async () => {
      try { const res = await api.get(`/appointments/${id}`); setAppointment(res.data.appointment); }
      catch { showToast('Appointment not found', 'error'); }
      finally { setLoading(false); }
    };
    if (id) fetchAppt();
  }, [id]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!id) return;
    setProcessing(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        showToast('Razorpay SDK failed to load. Are you online?', 'error');
        setProcessing(false);
        return;
      }

      // 1. Create order on our backend
      const orderRes = await api.post('/payments/create-order', { appointmentId: id });
      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: keyId, 
        amount: amount * 100, // in paise
        currency: currency,
        name: 'Bookit',
        description: appointment?.service?.name || 'Appointment Payment',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await api.post('/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: id,
            });

            if (verifyRes.data.success) {
              setResult('success');
              showToast('Payment successful!', 'success');
            }
          } catch (err: any) {
            setResult('failed');
            showToast('Payment verification failed. Please contact support.', 'error');
          }
        },
        prefill: {
          name: appointment?.customer?.name || '',
          email: appointment?.customer?.email || '',
        },
        theme: {
          color: '#2563EB',
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            showToast('Payment cancelled', 'info');
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      setProcessing(false);
      showToast(err.response?.data?.error || 'Failed to initiate payment', 'error');
    }
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
        <p className="text-sm text-gray-500 text-center mb-6">Complete your booking securely with Razorpay</p>

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

          <Button variant="primary" className="w-full h-12 text-base" onClick={handlePayment} loading={processing}>
            <ShieldCheck className="w-5 h-5" />
            Pay ₹{appointment ? appointment.amount + Math.ceil(appointment.amount * 0.02) : 0} securely
          </Button>
          <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Payments are processed securely by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
