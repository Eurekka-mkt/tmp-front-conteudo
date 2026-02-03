import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingCart, Plus, Minus, BookOpen } from 'lucide-react';
import { Book } from '../../types/content';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../contexts/CartContext';
import { SalesHeader } from '../../components/sales/Header';
import { getCoverFormatted } from './BookList';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreTracking } from '../../hooks/useStoreTracking';

const PUBLIC_GET_BOOK = `
  query PublicGetBook($id: ID!) {
    publicGetBook(id: $id) {
      id
      title
      description
      price
      shippingPrice
      pages
      cover
      physical
      stock
      singleSale
      currency
    }
  }
`;

export function PublicBookDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { query } = useApi();
  const { addItem, state } = useCart();
  const isInCart = state.items.some((item) => item.course.id === id);
  const { track } = useStoreTracking();

  const { t, language } = useLanguage(); // 'br' | 'es'

  const fetchBook = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await query<{ publicGetBook: Book }>(
        PUBLIC_GET_BOOK,
        { id },
        false
      );
      setBook(response.publicGetBook);
      
      // Track book details view
      track('book_details_viewed', {
        bookId: id,
        bookTitle: response.publicGetBook.title,
        bookPrice: response.publicGetBook.price,
        bookCurrency: response.publicGetBook.currency,
        bookPhysical: response.publicGetBook.physical,
        language: language
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'es' ? 'es-ES' : 'pt-BR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  };

  const handleAddToCart = () => {
    if (!book) return;
    
    // Track add to cart from details page
    track('book_add_to_cart_details', {
      bookId: book.id,
      bookTitle: book.title,
      bookPrice: book.price,
      bookCurrency: book.currency,
      bookPhysical: book.physical,
      singleSale: book.singleSale,
      quantity: quantity,
      language: language
    });
    
    if (book.singleSale) {
      navigate(`/${language}/checkout?type=book&id=${book.id}`);
    } else {
      addItem(book, quantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('common.error')}</p>
          <Link to={`/${language}/books`} className="text-blue-600 hover:underline">
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  const currency = book.currency || 'BRL';

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="aspect-[3/4] w-64 mx-auto lg:w-80 rounded-xl overflow-hidden bg-gray-100">
              {book.cover ? (
                <img
                  src={getCoverFormatted(book.cover)}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
              <p className="text-gray-600 whitespace-pre-line">{book.description}</p>

              <div className="flex items-center space-x-2 mt-4">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    book.physical ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {book.physical ? t('book.physicalBook') : t('book.digitalBook')}
                </span>
                {book.singleSale && (
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    {t('book.directPurchase')}
                  </span>
                )}
                {book.physical && book.stock !== undefined && book.stock <= 5 && (
                  <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">
                    {book.stock === 0 ? t('book.outOfStock') : `Apenas ${book.stock} em estoque`}
                  </span>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">{t('book.details')}</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('book.pages')}</span>
                  <span className="font-medium">{book.pages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('book.format')}</span>
                  <span className="font-medium">{book.physical ? t('book.printed') : t('book.pdf')}</span>
                </div>
                {book.physical && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('book.stock')}</span>
                      <span className="font-medium">
                        {book.stock || 0} {t('book.units')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('book.shipping')}</span>
                      <span className="font-medium">
                        {book.shippingPrice ? formatPrice(book.shippingPrice, currency) : t('book.free')}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('book.language')}</span>
                  <span className="font-medium">{t('book.portuguese')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-yellow-500">
                      {formatPrice(book.price || 0, currency)}
                    </div>
                    {book.physical && book.shippingPrice ? (
                      <div className="text-sm text-gray-500 mt-1">
                        + {formatPrice(book.shippingPrice, currency)} de frete
                      </div>
                    ) : null}
                  </div>
                </div>

                {book.physical && !book.singleSale && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('book.quantity')}
                    </label>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 border border-gray-300 rounded-lg min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(book.stock ?? 999, q + 1))}
                        disabled={book.stock !== undefined && quantity >= (book.stock ?? 0)}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {book.stock !== undefined && book.stock <= 10 && (
                      <p className="text-sm text-orange-600 text-center mt-2">
                        {t('book.onlyAvailable').replace('{count}', String(book.stock))}
                      </p>
                    )}
                  </div>
                )}

                {book.physical && book.stock === 0 ? (
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white text-center py-3 rounded-lg font-medium cursor-not-allowed"
                  >
                    {t('book.outOfStock')}
                  </button>
                ) : isInCart && !book.singleSale ? (
                  <Link
                    to={`/${language}/cart`}
                    className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    {t('books.viewCart')}
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-black text-white text-center py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{book.singleSale ? t('book.buyNow') : t('book.addToCart')}</span>
                  </button>
                )}

                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm">
                      {book.physical ? t('book.deliveryBrazil') : t('book.immediateAccess')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm">
                      {book.physical ? t('book.originalProduct') : t('book.unlimitedDownload')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm">{t('book.onlineSupport')}</span>
                  </div>
                  {book.physical && (
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm">{t('book.deliveryTime')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Link to={`/${language}/books`} className="text-blue-600 hover:underline">
            {t('common.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
