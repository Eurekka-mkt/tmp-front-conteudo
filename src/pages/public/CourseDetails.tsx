import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronDown, ChevronUp, ShoppingCart, BookOpen } from 'lucide-react';
import type { Course } from '../../types/course';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../contexts/CartContext';
import { SalesHeader } from '../../components/sales/Header';
import { useLanguage } from '../../contexts/LanguageContext';
import { useStoreTracking } from '../../hooks/useStoreTracking';

const PUBLIC_GET_COURSE = `
  query PublicGetCourse($id: ID!) {
    publicGetCourse(id: $id) {
      id
      createdAt
      updatedAt
      title
      slug
      description
      thumbnailUrl
      price
      currency
      singleSale
    }
  }
`;

export function PublicCourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});

  const { query } = useApi();
  const { addItem, state } = useCart();
  const isInCart = state.items.some((item) => item.course.id === id);
  const { track } = useStoreTracking();

  // agora pegamos também o apiLanguage para mandar ao backend
  const { t, language, apiLanguage } = useLanguage();

  const fetchCourse = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await query<{ publicGetCourse: Course }>(
        PUBLIC_GET_COURSE,
        { id },
        false
      );
      setCourse(response.publicGetCourse);
      
      // Track course details view
      track('course_details_viewed', {
        courseId: id,
        courseTitle: response.publicGetCourse.title,
        coursePrice: response.publicGetCourse.price,
        courseCurrency: response.publicGetCourse.currency,
        language: apiLanguage
      });
    } catch (err) {
      console.error("Erro em publicGetCourse: ", err);
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id, apiLanguage]);

  const toggleModule = (index: number) => {
    setOpenModules((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const formatPrice = (price: number, currency: string) => {
    const locale = language === 'es' ? 'es-ES' : 'pt-BR';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  };

  const handleAddToCart = () => {
    if (!course) return;
    
    // Track add to cart from details page
    track('course_add_to_cart_details', {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || t('common.error')}</p>
          <Link to={`/${language}/courses`} className="text-blue-600 hover:underline">
            {t('cart.backToCourses')}
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
          {/* Course Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-600">{course.description}</p>
              {course.singleSale && (
                <div className="mt-4">
                  <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                    {t('book.directPurchase')}
                  </span>
                </div>
              )}
            </div>

            {/* Course Content */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('course.content')}</h2>
              <div className="space-y-4">
                {course.lessons?.withModules ? (
                  course.lessons.modules?.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border rounded-lg bg-white">
                      <button
                        onClick={() => toggleModule(moduleIndex)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <span className="font-medium">{module.title}</span>
                        {openModules[moduleIndex] ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {openModules[moduleIndex] && (
                        <div className="px-4 pb-3">
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="py-2 pl-4 border-l-2 border-gray-100 ml-2">
                              <div className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                                <div>
                                  <p className="font-medium">{lesson.title}</p>
                                  {lesson.description && (
                                    <p className="text-sm text-gray-500">{lesson.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="border rounded-lg bg-white divide-y">
                    {course.lessons?.lessons?.map((lesson, index) => (
                      <div key={index} className="p-4">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{lesson.title}</p>
                            {lesson.description && (
                              <p className="text-sm text-gray-500">{lesson.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checkout Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {formatPrice(course.price || 0, course.currency || 'BRL')}
                  </div>
                </div>

                {isInCart && !course.singleSale ? (
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
                    <span>{course.singleSale ? t('course.buyNow') : t('course.addToCart')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Voltar para lista */}
        <div className="mt-10">
          <Link to={`/${language}/courses`} className="text-blue-600 hover:underline">
            {t('cart.backToCourses')}
          </Link>
        </div>
      </div>
    </div>
  );
}
