import { useMemo, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ShoppingCart, Package } from 'lucide-react';
import { Combo, PaginatedCombos, ComboStatus } from '../../types/combo';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../contexts/CartContext';
import { SalesHeader } from '../../components/sales/Header';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreTracking } from '../../hooks/useStoreTracking';

const PUBLIC_LIST_COMBOS = `
  query PublicListCombos($offset: Int, $limit: Int, $search: String, $language: Language) {
    publicListCombos(offset: $offset, limit: $limit, search: $search, language: $language) {
      data {
        id
        title
        description
        price
        cover
        currency
        language
        singleSale
        status
        bookIds
        courseIds
        books {
          id
          title
          physical
          cover
        }
        courses {
          id
          title
          thumbnailUrl
        }
        cis {
          value
          locale
        }
        meds {
          value
        }
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

export function PublicComboList() {
  const { query } = useApi();
  const { addItem, state } = useCart();
  const navigate = useNavigate();
  const { t, language, apiLanguage } = useLanguage();
  const { track } = useStoreTracking();

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [combos, setCombos] = useState<PaginatedCombos | null>(null);

  const search = searchParams.get('q') ?? '';
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const fetchCombos = async (page: number, q: string) => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * 12;

      const response = await query<{ publicListCombos: PaginatedCombos }>(
        PUBLIC_LIST_COMBOS,
        { offset, limit: 12, search: q, language: apiLanguage },
        false
      );

      setCombos(response.publicListCombos);
      
      // Track combo list view
      track('combo_list_viewed', {
        language: apiLanguage,
        search: q,
        page,
        totalResults: response.publicListCombos.data.length,
        totalPages: response.publicListCombos.pageInfo.totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch combos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos(currentPage, search);
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

  const handleAddToCart = (combo: Combo) => {
    // Track add to cart action
    track('combo_add_to_cart', {
      comboId: combo.id,
      comboTitle: combo.title,
      comboPrice: combo.price,
      comboCurrency: combo.currency,
      singleSale: combo.singleSale,
      itemsCount: getItemsCount(combo),
      language: apiLanguage
    });
    
    if (combo.singleSale) {
      navigate(`/${language}/checkout?type=combo&id=${combo.id}`);
    } else {
      addItem(combo, 1);
    }
  };

  const isInCart = (comboId: string) =>
    state.items.some((item) => item.course.id === comboId);

  const getItemsCount = (combo: Combo) => {
    return combo.courseIds.length + combo.bookIds.length + combo.cis.length + combo.meds.length;
  };

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
                  Combos Especiais
                </h1>
                <p className="text-base md:text-lg text-yellow-300 mb-6">
                  Pacotes completos com cursos, livros e consultas
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar combos..."
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

      {/* Combo List */}
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
              {combos?.data
                .filter(combo => combo.status === ComboStatus.ACTIVE)
                .map((combo) => (
                <div
                  key={combo.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 group"
                >
                  <Link to={`/${language}/combos/${combo.id}`} className="block">
                    <div className="aspect-video relative bg-gray-100">
                      {combo.cover ? (
                        <img
                          src={combo.cover}
                          alt={combo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
                          Combo
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {combo.title}
                      </h3>
                      <div 
                        className="text-gray-600 text-sm mb-4 line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: combo.description?.replace(/<[^>]*>/g, '').substring(0, 100) + '...' || '' 
                        }}
                      />
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {getItemsCount(combo)} itens
                        </span>
                        {combo.courseIds.length > 0 && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            {combo.courseIds.length} curso(s)
                          </span>
                        )}
                        {combo.bookIds.length > 0 && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                            {combo.bookIds.length} livro(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-yellow-500">
                          {formatPrice(combo.price || 0, combo.currency || 'BRL')}
                        </span>
                      </div>

                      {isInCart(combo.id) && !combo.singleSale ? (
                        <Link
                          to={`/${language}/cart`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          {t('courses.viewCart')}
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(combo)}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>
                            {combo.singleSale ? 'Comprar Agora' : 'Comprar'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {combos?.data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum combo encontrado</p>
              </div>
            )}

            {combos && combos.pageInfo.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!combos.pageInfo.hasPreviousPage}
                    className="p-2 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="hidden md:flex items-center space-x-2">
                    {Array.from(
                      { length: combos.pageInfo.totalPages },
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
                      currentPage < combos.pageInfo.totalPages && (
                        <button
                          onClick={() => handlePageChange(currentPage)}
                          className="w-10 h-10 rounded-lg border bg-yellow-500 text-white border-yellow-500"
                        >
                          {currentPage}
                        </button>
                      )}

                    {combos.pageInfo.totalPages > 1 && (
                      <button
                        onClick={() =>
                          handlePageChange(combos.pageInfo.totalPages)
                        }
                        className={`w-10 h-10 rounded-lg border ${
                          currentPage === combos.pageInfo.totalPages
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {combos.pageInfo.totalPages}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!combos.pageInfo.hasNextPage}
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