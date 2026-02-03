import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingCart, Package, BookOpen, Users, Stethoscope } from 'lucide-react';
import { Combo } from '../../types/combo';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../contexts/CartContext';
import { SalesHeader } from '../../components/sales/Header';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreTracking } from '../../hooks/useStoreTracking';

const PUBLIC_GET_COMBO = `
  query PublicGetCombo($id: ID!) {
    publicGetCombo(id: $id) {
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
      books {
        id
        title
        description
        pages
        code
        cover
        physical
      }
      courseIds
      courses {
        id
        title
        slug
        description
        thumbnailUrl
      }
      cis {
        value
        locale
      }
      meds {
        value
      }
    }
  }
`;

export function PublicComboDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [combo, setCombo] = useState<Combo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { query } = useApi();
  const { addItem, state } = useCart();
  const isInCart = state.items.some((item) => item.course.id === id);
  const { track } = useStoreTracking();

  const { t, language, apiLanguage } = useLanguage();

  const fetchCombo = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await query<{ publicGetCombo: Combo }>(
        PUBLIC_GET_COMBO,
        { id },
        false
      );
      setCombo(response.publicGetCombo);
      
      // Track combo details view
      track('combo_details_viewed', {
        comboId: id,
        comboTitle: response.publicGetCombo.title,
        comboPrice: response.publicGetCombo.price,
        comboCurrency: response.publicGetCombo.currency,
        coursesCount: response.publicGetCombo.courses?.length || 0,
        booksCount: response.publicGetCombo.books?.length || 0,
        cisCount: response.publicGetCombo.cis?.length || 0,
        medsCount: response.publicGetCombo.meds?.length || 0,
        language: apiLanguage
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombo();
  }, [id, apiLanguage]);

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'es' ? 'es-ES' : 'pt-BR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  };

  const handleAddToCart = () => {
    if (!combo) return;
    
    // Track add to cart from details page
    track('combo_add_to_cart_details', {
      comboId: combo.id,
      comboTitle: combo.title,
      comboPrice: combo.price,
      comboCurrency: combo.currency,
      singleSale: combo.singleSale,
      coursesCount: combo.courses?.length || 0,
      booksCount: combo.books?.length || 0,
      cisCount: combo.cis?.length || 0,
      medsCount: combo.meds?.length || 0,
      language: apiLanguage
    });
    
    if (combo.singleSale) {
      navigate(`/${language}/checkout?type=combo&id=${combo.id}`);
    } else {
      addItem(combo, 1);
    }
  };

  const getCoverFormatted = (cover: string) => {
    if (cover && cover.includes('drive.google')) {
      const coverId = cover.split('/')[cover.split('/').length - 2];
      return `https://drive.google.com/thumbnail?id=${coverId}&sz=w1000`;
    }
    return cover;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('common.error')}</p>
          <Link to={`/${language}/combos`} className="text-blue-600 hover:underline">
            Voltar para combos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Combo Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
              {combo.cover ? (
                <img src={combo.cover} alt={combo.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full font-medium">
                  Combo Especial
                </span>
                {combo.singleSale && (
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    Venda Direta
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">{combo.title}</h1>
              <div 
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: combo.description || '' }}
              />
            </div>

            {/* Combo Content */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Conteúdo do Combo</h2>
              
              {/* Courses */}
              {combo.courses && combo.courses.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Cursos Inclusos ({combo.courses.length})
                  </h3>
                  <div className="space-y-4">
                    {combo.courses.map((course) => (
                      <div key={course.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Books */}
              {combo.books && combo.books.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-green-600" />
                    Livros Inclusos ({combo.books.length})
                  </h3>
                  <div className="space-y-4">
                    {combo.books.map((book) => (
                      <div key={book.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="w-16 h-20 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {book.cover ? (
                            <img
                              src={getCoverFormatted(book.cover)}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{book.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{book.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              book.physical 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {book.physical ? 'Físico' : 'Digital'}
                            </span>
                            <span className="text-xs text-gray-500">{book.pages} páginas</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CI Services */}
              {combo.cis && combo.cis.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                    Conversas Iniciais ({combo.cis.length})
                  </h3>
                  <div className="space-y-4">
                    {combo.cis.map((ci, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Conversa Inicial - {ci.locale === 'BR' ? 'Brasil' : 'Espanha'}</h4>
                          <p className="text-sm text-gray-500">Sessão individual de terapia</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-purple-600">
                            {formatPrice(ci.value, ci.locale === 'BR' ? 'BRL' : 'USD')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MED Services */}
              {combo.meds && combo.meds.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Stethoscope className="w-5 h-5 mr-2 text-red-600" />
                    Consultas Médicas ({combo.meds.length})
                  </h3>
                  <div className="space-y-4">
                    {combo.meds.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Consulta Psiquiátrica</h4>
                          <p className="text-sm text-gray-500">Consulta médica especializada</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-red-600">
                            {formatPrice(med.value, 'BRL')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {formatPrice(combo.price || 0, combo.currency || 'BRL')}
                  </div>
                  <p className="text-sm text-gray-500">Valor total do combo</p>
                </div>

                {isInCart && !combo.singleSale ? (
                  <Link
                    to={`/${language}/cart`}
                    className="block w-full bg-green-600 text-white text-center py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    {t('courses.viewCart')}
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-yellow-600 text-white text-center py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{combo.singleSale ? 'Comprar Agora' : 'Adicionar ao Carrinho'}</span>
                  </button>
                )}

                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm">Acesso imediato aos cursos digitais</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm">Suporte online especializado</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm">Garantia de satisfação</span>
                  </div>
                  {combo.books?.some(book => book.physical) && (
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-sm">Entrega em todo Brasil (livros físicos)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Link to={`/${language}/combos`} className="text-blue-600 hover:underline">
            Voltar para combos
          </Link>
        </div>
      </div>
    </div>
  );
}