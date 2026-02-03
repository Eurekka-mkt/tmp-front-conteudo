import { ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { CheckoutResponse } from "./Checkout";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreTracking } from '../../hooks/useStoreTracking';

export const PostCheckoutLS = {
  get: (): CheckoutResponse | undefined => {
    const str = localStorage.getItem("PostCheckoutLS");
    return str ? JSON.parse(str) : undefined;
  },
  set: (data: CheckoutResponse) => {
    localStorage.setItem("PostCheckoutLS", JSON.stringify(data));
  },
};

export function PostCheckout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { track } = useStoreTracking();
  const data = PostCheckoutLS.get();

  const query = useQuery({
    queryKey: ["postcheckout-orders-status", data?._id],
    queryFn: async () => {
      const res = await axios.get<{
        _id: string;
        paid: boolean;
        paidAt: string;
        value: number;
        currency: string;
      }>(
        `https://us-central1-${import.meta.env.VITE_V1_URL_ID}.cloudfunctions.net/orders/${data?._id}/status`
      );
      return res.data;
    },
    enabled: !!data?._id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!data) navigate("/cart");
  }, [data, navigate]);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.location.assign("/")}
              className="flex items-center space-x-2 text-white hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t("common.back")}</span>
            </button>
            <div className="flex items-center space-x-2">
              <img
                src="https://eurekka-wordpress.s3.amazonaws.com/wp-content/uploads/2020/09/15222523/logo-eurekka-1.png"
                width={120}
                alt=""
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">{t("postcheckout.title")}</h1>

              {query.data?.paid ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {t("postcheckout.status.approved")}
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {t("postcheckout.status.pending")}
                </span>
              )}
            </div>

            {query.data?.paid ? (
              <SuccessView />
            ) : "url" in data ? (
              <Redirect />
            ) : (
              <Pix data={data} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SuccessView = () => {
  const { t } = useLanguage();
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold mb-4">{t("postcheckout.success.title")}</h1>
      <p className="text-gray-600 mb-6">{t("postcheckout.success.message")}</p>
      <div className="bg-gray-50 rounded-lg p-6 w-full mx-auto">
        <h3 className="font-medium text-gray-900 mb-3">{t("postcheckout.success.steps")}</h3>
        <ol className="text-sm text-gray-600 space-y-2 text-left">
          <li>{t("postcheckout.success.step1")}</li>
          <li>{t("postcheckout.success.step2")}</li>
          <li>{t("postcheckout.success.step3")}</li>
        </ol>
      </div>
      <button
        onClick={() => window.location.assign("/")}
        className="mt-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        {t("common.back")}
      </button>
    </div>
  );
};

const Redirect = () => {
  const { t } = useLanguage();
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-blue-600 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-4">{t("postcheckout.redirect.title")}</h1>
      <p className="text-gray-600 mb-6">{t("postcheckout.redirect.message")}</p>
      <div className="bg-gray-50 rounded-lg p-6 w-full mx-auto">
        <h3 className="font-medium text-gray-900 mb-3">{t("postcheckout.redirect.important")}</h3>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          <li>• {t("postcheckout.redirect.item1")}</li>
          <li>• {t("postcheckout.redirect.item2")}</li>
          <li>• {t("postcheckout.redirect.item3")}</li>
          <li>• {t("postcheckout.redirect.item4")}</li>
        </ul>
      </div>
    </div>
  );
};

const Pix = ({ data }: { data: { text: string; image: string; expiration: string } }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const formatExpirationTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-emerald-600"
          >
            <path d="M3.74181 13.8002L6.56081 16.6002L9.37881 13.8002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.55945 4.2002V16.6002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.2583 10.2002L17.4393 7.4002L14.6213 10.2002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.4406 19.8002V7.4002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("postcheckout.pix.title")}</h1>
        <p className="text-gray-600">{t("postcheckout.pix.helper")}</p>
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex justify-center">
          <img src={data.image} alt="QR Code PIX" className="w-48 h-48" />
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 break-all font-mono text-sm">{data.text}</div>
            <button onClick={handleCopyCode} className="ml-4 p-2 text-gray-500 hover:text-gray-700">
              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t("postcheckout.pix.expires")}
            <br />
            <span className="font-medium text-gray-900">{formatExpirationTime(data.expiration)}</span>
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">{t("postcheckout.pix.howToPay")}</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li>{t("postcheckout.pix.step1")}</li>
            <li>{t("postcheckout.pix.step2")}</li>
            <li>{t("postcheckout.pix.step3")}</li>
            <li>{t("postcheckout.pix.step4")}</li>
          </ol>
        </div>
      </div>
    </>
  );
};
