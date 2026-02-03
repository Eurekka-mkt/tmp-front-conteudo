import { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Book, PaginatedResponse } from '../../types/content';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../contexts/CartContext';
import { SalesHeader } from '../../components/sales/Header';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreTracking } from '../../hooks/useStoreTracking';

const PUBLIC_LIST_BOOKS = `
  query PublicListBooks($offset: Int, $limit: Int, $search: String, $language: Language, $physical: Boolean) {
    publicListBooks(offset: $offset, limit: $limit, search: $search, language: $language, physical: $physical) {
      data {
        id
        title
        description
        price
        shippingPrice
        pages
        cover
        physical
        stock
        language
        currency
        singleSale
        orderBump {
          data
          type
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        currentPage
        totalPages
      }
    }
  }
`;

export const getCoverFormatted = (currentCover: string) => {
  if (currentCover?.includes('drive.google')) {
    const segments = currentCover.split('/');
    const coverId = segments[segments.length - 2];
    return `https://drive.google.com/thumbnail?id=${coverId}&sz=w1000`;
  }
  return currentCover;
};

export function PublicBookList() {
  const { query } = useApi();
  const { addItem, state } = useCart();
  const navigate = useNavigate();
  const { t, language, apiLanguage } = useLanguage();
  const { track } = useStoreTracking();

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<PaginatedResponse<Book> | null>(null);

  const search = searchParams.get('q') ?? '';
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const fetchBooks = async (page: number, q: string) => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * 12;

      const response = await query<{ publicListBooks: PaginatedResponse<Book> }>(
        PUBLIC_LIST_BOOKS,
        { offset, limit: 12, search: q, language: apiLanguage, physical: true },
        false
      );

      setBooks(response.publicListBooks);

      // Track book list view
      track('book_list_viewed', {
        language: apiLanguage,
        search: q,
        page,
        totalResults: response.publicListBooks.data.length,
        totalPages: response.publicListBooks.pageInfo.totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(currentPage, search);
  }, [currentPage, search, apiLanguage]);

  const handlePageChange = (page: number) => {
    const next = page < 1 ? 1 : page;
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', String(next));
      if (search) params.set('q', search); else params.delete('q');
      return params;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', '1');
      if (value) params.set('q', value); else params.delete('q');
      return params;
    });
  };

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'es' ? 'es-ES' : 'pt-BR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  };

  const handleAddToCart = (book: Book) => {
    // Track add to cart action
    track('book_add_to_cart', {
      bookId: book.id,
      bookTitle: book.title,
      bookPrice: book.price,
      bookCurrency: book.currency,
      bookPhysical: book.physical,
      singleSale: book.singleSale,
      language: apiLanguage
    });
    
    if (book.singleSale) {
      navigate(`/${language}/checkout?type=book&id=${book.id}`);
    } else {
      addItem(book, 1);
    }
  };

  const isInCart = (bookId: string) =>
    state.items.some((item) => item.course.id === bookId);

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesHeader />

      {/* Hero Section */}
      <div className="relative bg-black text-white h-[40vh] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-90" />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">
                  {t('books.title')}
                </h1>
                <p className="text-base md:text-lg text-yellow-300 mb-6">
                  {t('books.subtitle')}
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('books.search')}
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-6 py-3 rounded-full text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books?.data.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 group"
                >
                  <Link to={`/${language}/books/${book.id}`} className="block">
                    <div className="aspect-square relative bg-gray-100">
                      {book.cover && (
                        <img
                          src={getCoverFormatted(book.cover)}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {book.description}
                      </p>
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            book.physical
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {book.physical ? t('books.physical') : t('books.digital')}
                        </span>
                        {book.physical &&
                          book.stock !== undefined &&
                          book.stock <= 5 && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              {book.stock <= 0
                                ? t('books.outOfStock')
                                : `${book.stock} ${t('books.remaining')}`}
                            </span>
                          )}
                      </div>
                    </div>
                  </Link>

                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-yellow-500">
                          {formatPrice(book.price || 0, book.currency || 'BRL')}
                        </span>
                        {book.physical && book.shippingPrice ? (
                          <p className="text-xs text-gray-500">
                            + {formatPrice(book.shippingPrice, book.currency || 'BRL')} {t('cart.shipping')}
                          </p>
                        ) : null}
                      </div>

                      {book.physical && book.stock === 0 ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium cursor-not-allowed"
                        >
                          {t('books.outOfStock')}
                        </button>
                      ) : isInCart(book.id) && !book.singleSale ? (
                        <Link
                          to={`/${language}/cart`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          {t('books.viewCart')}
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(book)}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>
                            {book.singleSale ? t('books.buyNow') : t('books.buy')}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {books?.data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('books.noResults')}</p>
              </div>
            )}

            {books && books.pageInfo.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!books.pageInfo.hasPreviousPage}
                    className="p-2 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="hidden md:flex items-center space-x-2">
                    {Array.from(
                      { length: books.pageInfo.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-lg border ${
                          currentPage === page
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <div className="flex md:hidden items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      className={`w-10 h-10 rounded-lg border ${
                        currentPage === 1
                          ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      1
                    </button>

                    {currentPage > 2 &&
                      currentPage < books.pageInfo.totalPages && (
                        <button
                          onClick={() => handlePageChange(currentPage)}
                          className="w-10 h-10 rounded-lg border bg-yellow-500 text-white border-yellow-500"
                        >
                          {currentPage}
                        </button>
                      )}

                    {books.pageInfo.totalPages > 1 && (
                      <button
                        onClick={() =>
                          handlePageChange(books.pageInfo.totalPages)
                        }
                        className={`w-10 h-10 rounded-lg border ${
                          currentPage === books.pageInfo.totalPages
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {books.pageInfo.totalPages}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!books.pageInfo.hasNextPage}
                    className="p-2 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
