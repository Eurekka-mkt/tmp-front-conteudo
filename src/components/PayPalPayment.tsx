import { PayPalButtons, PayPalButtonsComponentProps, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { createOrderPayPalContent, captureOrderPayPalContent } from '../api/paypal';
import { useStoreTracking } from '../hooks/useStoreTracking';

type PayPalPaymentProps = {
  token: string;
  value: number;
  currency: string;
  email: string;
  voucherId?: string;
  onSuccess: (result: any) => void;
  onError: (err: any) => void;
};

export function PayPalPayment({
  token,
  value,
  currency,
  email,
  voucherId,
  onSuccess,
  onError
}: PayPalPaymentProps) {
  const { track } = useStoreTracking();
  
  if(!(token || value && currency && email)) return null;

  const buttonsProps: PayPalButtonsComponentProps = {
    style: { layout: "vertical" },
    createOrder: async () => {
      try {
        // Track PayPal order creation
        track('paypal_order_created', {
          email,
          value,
          currency,
          hasVoucher: !!voucherId,
          hasAddress: !!address
        }, email);
        
        const orderId = await createOrderPayPalContent({
          token,
          email,
          value,
          currency,
          cupomId: voucherId,
        });
        return orderId;
      } catch (err) {
        onError(err);
        throw err;
      }
    },
    onApprove: async (data) => {
      try {
        // Track PayPal payment approval
        track('paypal_payment_approved', {
          email,
          orderId: (data as any).orderID,
          value,
          currency
        }, email);
        
        const result = await captureOrderPayPalContent({
          paypalId: (data as any).orderID,
          token,
          capture: true,
        });
        onSuccess(result);
        
        // Track PayPal payment completed
        track('paypal_payment_completed', {
          email,
          orderId: (data as any).orderID,
          value,
          currency
        }, email);
      } catch (err) {
        onError(err);
      }
    },
    onError: (err) => {
      // Track PayPal payment error
      track('paypal_payment_error', {
        email,
        error: err?.message || 'Unknown PayPal error',
        value,
        currency
      }, email);
      
      onError(err);
      console.error("Erro no pagamento (PayPal):", err);
    },
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_APP_PAYPAL_CLIENT_ID,
        currency
      }}
    >
      <div className="w-full flex flex-col items-center p-4">
        <PayPalButtons {...(buttonsProps as any)} />
      </div>
    </PayPalScriptProvider>
  );
}