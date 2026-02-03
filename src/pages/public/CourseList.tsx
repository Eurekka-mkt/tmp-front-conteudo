import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Course, PaginatedResponse } from '../../types/course';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../contexts/CartContext';
import { SalesHeader } from '../../components/sales/Header';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreTracking } from '../../hooks/useStoreTracking';

const PUBLIC_LIST_COURSES = `
  query PublicListCourses($offset: Int, $limit: Int, $search: String, $language: Language) {
    publicListCourses(offset: $offset, limit: $limit, search: $search, language: $language) {
      data {
        id
        title
        description
        thumbnailUrl
        price
        currency
        language
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

export function PublicCourseList() {
  const navigate = useNavigate();
  const { query } = useApi();
  const { addItem, state } = useCart();
  const { language, apiLanguage, t } = useLanguage(); // language: 'br' | 'es' (slug); apiLanguage: 'PT_BR' | 'ES'
  const { track } = useStoreTracking();

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<PaginatedResponse<Course> | null>(null);

  // Deriva filtros da URL (?q= & ?page=)
  const search = searchParams.get('q') ?? '';
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get('page') ?? '1', 10);
    return Number.isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const fetchCourses = async (page: number, q: string) => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * 12;

      const response = await query<{ publicListCourses: PaginatedResponse<Course> }>(
        PUBLIC_LIST_COURSES,
        { offset, limit: 12, search: q, language: apiLanguage },
        false
      );

      // setCourses(response.publicListCourses);
      setCourses({
        data: [],
        pageInfo: {
          hasNextPage: 1,
          hasPreviousPage: 1,
          currentPage: 1,
          totalPages: 1
        }
      });
      
      // Track course list view
      track('course_list_viewed', {
        language: apiLanguage,
        search: q,
        page,
        totalResults: response.publicListCourses.data.length,
        totalPages: response.publicListCourses.pageInfo.totalPages
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  // Recarrega quando muda idioma, busca ou página
  useEffect(() => {
    fetchCourses(currentPage, search);
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
      params.set('page', '1'); // reset de página ao mudar busca
      if (value) params.set('q', value); else params.delete('q');
      return params;
    });
  };

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'es' ? 'es-ES' : 'pt-BR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  };

  const handleCardClick = (id: string) => {
    // Track course click
    const course = courses?.data.find(c => c.id === id);
    if (course) {
      track('course_clicked', {
        courseId: id,
        courseTitle: course.title,
        coursePrice: course.price,
        courseCurrency: course.currency,
        language: apiLanguage
      });
    }
    navigate(`/${language}/courses/${id}`);
  };

  const handleAddToCart = (course: Course, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Track add to cart action
    track('course_add_to_cart', {
      courseId: course.id,
      courseTitle: course.title,
      coursePrice: course.price,
      courseCurrency: course.currency,
      singleSale: course.singleSale,
      language: apiLanguage
    });
    
    if (course.singleSale) {
      navigate(`/${language}/checkout?type=course&id=${course.id}`);
    } else {
      addItem(course, 1);
    }
  };

  const isInCart = (courseId: string) =>
    state.items.some((item) => item.course.id === courseId);

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesHeader />

      {/* Hero Section */}
      <div className="relative bg-black text-white h-[40vh] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-90" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4">
                  {t('courses.title')}
                </h1>
                <p className="text-base md:text-lg text-yellow-300 mb-6">
                  {t('courses.subtitle')}
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('courses.search')}
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-6 py-3 rounded-full text-gray-900 bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses?.data.map((course: any) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 group"
                >
                  <div className="cursor-pointer" onClick={() => handleCardClick(course.id)}>
                    <div className="aspect-video relative bg-gray-100">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-yellow-500">
                        {formatPrice(course.price || 0, course.currency || 'BRL')}
                      </span>

                      {isInCart(course.id) && !course.singleSale ? (
                        <Link
                          to={`/${language}/cart`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          {t('courses.viewCart')}
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCart(course, e)}
                          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors flex items-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>{course.singleSale ? t('courses.buyNow') : t('courses.buy')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {courses?.data.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('courses.noResults')}</p>
              </div>
            )}

            {/* Pagination */}
            {courses && courses.pageInfo.totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!courses.pageInfo.hasPreviousPage}
                    className="p-2 rounded-lg border bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Page numbers (desktop) */}
                  <div className="hidden md:flex items-center space-x-2">
                    {Array.from({ length: courses.pageInfo.totalPages }, (_, i) => i + 1).map((page) => (
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

                  {/* Mobile pagination */}
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

                    {currentPage > 2 && currentPage < courses.pageInfo.totalPages && (
                      <button className="w-10 h-10 rounded-lg border bg-white text-gray-600">
                        {currentPage}
                      </button>
                    )}

                    {courses.pageInfo.totalPages > 1 && (
                      <button
                        onClick={() => handlePageChange(courses.pageInfo.totalPages)}
                        className={`w-10 h-10 rounded-lg border ${
                          currentPage === courses.pageInfo.totalPages
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {courses.pageInfo.totalPages}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!courses.pageInfo.hasNextPage}
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
