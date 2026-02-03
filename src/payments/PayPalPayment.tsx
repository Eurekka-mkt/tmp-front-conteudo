// src/components/PayPalPayment.tsx
import { PayPalButtons, PayPalButtonsComponentProps, PayPalScriptProvider } from '@paypal/react-paypal-js';
import axios from 'axios';

type Address = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string; // "BRA"
  zip: string;
};

type PayPalContentPaymentProps = {
  token: string;               // token gerado no create-checkout-token (CONTENT)
  value: number;               // valor final em CENTAVOS (já com desconto + frete)
  currency: string;            // "BRL" | "USD"...
  email: string;
  voucherId?: string;          // _id do cupom
  address?: Address;           // obrigatório qdo houver livro físico
  onSuccess: (result: any) => void;
  onError: (err: any) => void;
};

export function PayPalPayment({
  token, value, currency, email, voucherId, address, onSuccess, onError
}: PayPalContentPaymentProps) {
  if (!currency) return null;

  const buttonsProps: PayPalButtonsComponentProps = {
    style: { layout: 'vertical' },

    createOrder: async () => {
      try {
        const { data } = await axios.post<{ orderId: string }>(
          `https://us-central1-${import.meta.env.VITE_V1_URL_ID}.cloudfunctions.net/checkout/paypal/content/create`,
          {
            token,
            email,
            value,        // em cents
            currency,
            cupomId: voucherId,
            address       // opcional (somente quando físico)
          }
        );
        return data.orderId;
      } catch (err) {
        onError(err);
        throw err;
      }
    },

    onApprove: async (data) => {
      try {
        const { data: captureResult } = await axios.post(
          `https://us-central1-${import.meta.env.VITE_V1_URL_ID}.cloudfunctions.net/checkout/paypal/content/capture`,
          { orderId: (data as any).orderID, token }
        );
        onSuccess(captureResult);
      } catch (err) {
        onError(err);
      }
    },

    onError: (err) => {
      onError(err);
      console.error('Erro no pagamento (PayPal CONTENT):', err);
    },
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_APP_PAYPAL_CLIENT_ID,
        currency,
      }}
    >
      <div className="w-full flex flex-col items-center p-4">
        <PayPalButtons {...(buttonsProps as any)} />
      </div>
    </PayPalScriptProvider>
  );
}
