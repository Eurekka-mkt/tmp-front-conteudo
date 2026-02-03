import axios from "axios";

export async function createOrderPayPalContent(payload: {
  token: string; 
  email: string; 
  value: number; 
  currency: string;
  cupomId?: string; 
  address?: any;
}): Promise<string> {
  const { data } = await axios.post<{ _id: string }>(
    `https://us-central1-${import.meta.env.VITE_V1_URL_ID}.cloudfunctions.net/checkout/redirect/paypal/content`,
    payload
  );
  return data._id;
}

export async function captureOrderPayPalContent(payload: {
  paypalId: string; 
  token: string;
  capture: boolean;
}) {
  const { data } = await axios.post(
    `https://us-central1-${import.meta.env.VITE_V1_URL_ID}.cloudfunctions.net/checkout/redirect/paypal/content`,
    payload
  );
  return data;
}