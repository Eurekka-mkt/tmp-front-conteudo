import { useEffect } from 'react';
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { getCoverFormatted } from "./BookList";
import { useLanguage } from "../../contexts/LanguageContext";
import { useStoreTracking } from "../../hooks/useStoreTracking";

export function Cart() {
  const { state, removeItem, updateQuantity } = useCart();
  const { t, language } = useLanguage();
  const { track } = useStoreTracking();

  // === Totais por moeda (preço + frete dos físicos) ===
  const totalsByCurrency = state.items.reduce<Record<string, number>>((acc, item) => {
    const currency =
      (("currency" in item.course ? (item.course as any).currency : "BRL") as string) || "BRL";
    const price = (item.course.price || 0) * item.quantity;
    const shipping =
      "physical" in item.course && item.course.physical && item.course.shippingPrice
        ? item.course.shippingPrice * item.quantity
        : 0;
    acc[currency] = (acc[currency] ?? 0) + price + shipping;
    return acc;
  }, {});

  // Track cart view on component mount
  useEffect(() => {
    if (state.items.length > 0) {
      track('cart_viewed', {
        itemsCount: state.items.length,
        totalValue: Object.values(totalsByCurrency).reduce((sum, val) => sum + val, 0),
        currencies: Object.keys(totalsByCurrency),
        items: state.items.map(item => ({
          id: item.course.id,
          title: item.course.title,
          price: item.course.price,
          quantity: item.quantity,
          type: 'courseIds' in item.course ? 'combo' : 'physical' in item.course ? 'book' : 'course'
        }))
      });
    }
  }, [state.items, totalsByCurrency, track]);

  const formatMoney = (price: number, currency: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(price);

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-black border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/courses" className="flex items-center space-x-2">
                <img
                  src="https://eurekka-wordpress.s3.amazonaws.com/wp-content/uploads/2020/09/15222523/logo-eurekka-1.png"
                  width={120}
                  alt=""
                />
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t("cart.empty")}</h2>
            <p className="text-gray-600 mb-8">{t("cart.emptySubtitle")}</p>
            <Link
              to={`/${language}/courses`}
              className="inline-flex items-center space-x-2 text-yellow-600 hover:text-yellow-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t("cart.backToCourses")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currencies = Object.keys(totalsByCurrency);
  const singleCurrency = currencies.length === 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/courses" className="flex items-center space-x-2">
              <img
                src="https://eurekka-wordpress.s3.amazonaws.com/wp-content/uploads/2020/09/15222523/logo-eurekka-1.png"
                width={120}
                alt=""
              />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">{t("cart.title")}</h1>

            <div className="divide-y">
              {state.items.map((item) => {
                const course: any = item.course;
                const currency = (("currency" in course ? course.currency : "BRL") as string) || "BRL";
                const isPhysical = "physical" in course && course.physical;

                return (
                  <div key={course.id} className="py-6 flex items-start space-x-4">
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {("thumbnailUrl" in course && course.thumbnailUrl) ||
                      ("cover" in course && course.cover) ? (
                        <img
                          src={
                            "thumbnailUrl" in course && course.thumbnailUrl
                              ? course.thumbnailUrl
                              : "cover" in course && course.cover
                              ? getCoverFormatted(course.cover)
                              : ""
                          }
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{course.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            {"physical" in course && course.physical && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                Físico
                              </span>
                            )}
                            {"physical" in course && !course.physical && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Digital
                              </span>
                            )}
                            {"courseIds" in course && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                Combo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-right">
                          <div className="font-bold text-yellow-600">
                            {formatMoney(course.price || 0, currency)}
                          </div>

                          {/* Frete na MOEDA DO ITEM */}
                          {isPhysical && course.shippingPrice && (
                            <div className="text-sm text-gray-500">
                              + {formatMoney(course.shippingPrice, currency)} {t("cart.shipping")}
                            </div>
                          )}
                        </div>

                        {/* Controles de quantidade (apenas físico) */}
                        {isPhysical && (
                          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg">
                            <button
                              onClick={() => updateQuantity(course.id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-2 py-1 min-w-[2rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  course.id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                "stock" in course && course.stock !== undefined
                                  ? item.quantity >= course.stock
                                  : false
                              }
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <button
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            // Track item removal
                            track('cart_item_removed', {
                              itemId: course.id,
                              itemTitle: course.title,
                              itemPrice: course.price,
                              quantity: item.quantity,
                              type: 'courseIds' in course ? 'combo' : 'physical' in course ? 'book' : 'course'
                            });
                            removeItem(course.id);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totais por moeda */}
            <div className="mt-8 pt-8 border-t space-y-3">
              {singleCurrency ? (
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">{t("cart.total")}</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {formatMoney(totalsByCurrency[currencies[0]], currencies[0])}
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-lg font-medium mb-2">{t("cart.total")}</div>
                  <div className="space-y-2">
                    {currencies.map((c) => (
                      <div key={c} className="flex justify-between items-center">
                        <span className="text-gray-700">Total ({c}):</span>
                        <span className="text-xl font-bold text-yellow-600">
                          {formatMoney(totalsByCurrency[c], c)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <Link
                to={`/${language}/checkout`}
                className="block w-full bg-yellow-600 text-white text-center py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                onClick={() => {
                  // Track checkout initiation
                  track('checkout_initiated', {
                    itemsCount: state.items.length,
                    totalValue: Object.values(totalsByCurrency).reduce((sum, val) => sum + val, 0),
                    currencies: Object.keys(totalsByCurrency),
                    items: state.items.map(item => ({
                      id: item.course.id,
                      title: item.course.title,
                      price: item.course.price,
                      quantity: item.quantity,
                      type: 'courseIds' in item.course ? 'combo' : 'physical' in item.course ? 'book' : 'course'
                    }))
                  });
                }}
              >
                {t("cart.checkout")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
