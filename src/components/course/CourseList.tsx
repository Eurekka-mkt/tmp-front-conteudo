import { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, LockKeyhole, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { CoursePaginated } from '../../types/course';
import { useApi } from '../../hooks/useApi';
import { Language } from '../books/BookList';

const normalizeLanguage = (val?: string | null): 'PT_BR' | 'ES' => {
  const up = (val ?? 'PT_BR').toUpperCase().replace('-', '_');
  return up === 'ES' ? 'ES' : 'PT_BR';
};

const LIST_COURSES_QUERY = `
  query ListCourses($offset: Int, $limit: Int, $search: String, $language: Language) {
    listCourses(offset: $offset, limit: $limit, search: $search, access: ADMIN, language: $language) {
      data {
        id
        title
        slug
        createdAt
        singleSale
        currency
        language
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

export function CourseList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CoursePaginated | null>(null);
  const navigate = useNavigate();
  const { query } = useApi();

  const fetchCourses = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const offset = (page - 1) * 10;

      const variables: Record<string, any> = { offset, limit: 10, search };
      if (languageFilter) variables.language = languageFilter;

      const response = await query<{ listCourses: CoursePaginated }>(
        LIST_COURSES_QUERY,
        variables
      );
      setCourses(response.listCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(1, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, languageFilter]);

  const handlePageChange = (page: number) => {
    fetchCourses(page, searchTerm);
  };

  const getLocaleFromLanguage = (lang: string) => {
    switch (lang) {
      case Language.ES:
        return 'es';
      case Language.PT_BR:
      default:
        return 'br';
    }
  }

  const items = courses?.data ?? [];

  return (
    <div className="p-4 lg:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold">Courses</h2>
            <Link
              to="/admin/courses/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Course</span>
            </Link>
          </div>

          {error ? (
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>

              <div className="flex gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Languages</option>
                    <option value="PT_BR">PT_BR</option>
                    <option value="ES">ES</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Title</th>
                          <th className="text-left py-3 px-4">Slug</th>
                          <th className="text-left py-3 px-4">Currency</th>
                          <th className="text-left py-3 px-4">Language</th>
                          <th className="text-left py-3 px-4">Created At</th>
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((course) => (
                          <tr
                            key={course.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{course.title}</p>
                                {course.singleSale && (
                                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Single Sale
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">{course.slug}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                {course.currency || 'BRL'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {normalizeLanguage(course.language)}{' '}
                                {/* null => PT_BR */}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {course.createdAt &&
                                new Date(course.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  course.singleSale
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {course.singleSale ? 'Direct' : 'Cart'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => 
                                      navigate('/admin/courses/permissions', {
                                        state: { course },
                                    })
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Remove"
                                >
                                  <LockKeyhole className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/courses/edit/${course.id}`)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                {course.singleSale && (
                                  <button
                                    onClick={() => {
                                      const url = `${window.location.origin}/#/${getLocaleFromLanguage(course.language ?? Language.PT_BR)}/checkout?type=course&id=${course.id}`;
                                      navigator.clipboard.writeText(url);
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                    title="Copiar link de pagamento"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-5 h-5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16h8M8 12h8m-7 8h6a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {courses && items.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {items.length} courses
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handlePageChange(courses.pageInfo.currentPage - 1)
                          }
                          disabled={!courses.pageInfo.hasPreviousPage}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm">
                          Page {courses.pageInfo.currentPage} of{' '}
                          {courses.pageInfo.totalPages}
                        </span>
                        <button
                          onClick={() =>
                            handlePageChange(courses.pageInfo.currentPage + 1)
                          }
                          disabled={!courses.pageInfo.hasNextPage}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {courses && items.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No courses found</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
