import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Book, PaginatedResponse } from '../../types/content';
import { useApi } from '../../hooks/useApi';
import { getCoverFormatted } from '../../pages/public/BookList';

const LIST_BOOKS_QUERY = `
  query ListBooks($offset: Int, $limit: Int, $search: String) {
    listBooks(offset: $offset, limit: $limit, search: $search, access: ADMIN) {
      data {
        id
        title
        description
        price
        shippingPrice
        pages
        code
        salesLink
        fileRef
        cover
        physical
        stock
        singleSale
        currency
        language
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

const REMOVE_BOOK_MUTATION = `
  mutation RemoveBook($id: ID!) {
    removeBook(id: $id)
  }
`;

export enum Language {
  PT_BR = 'PT_BR',
  ES = 'ES'
}

export function BookList() {
  const navigate = useNavigate();
  const { query } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<PaginatedResponse<Book> | null>(null);

  const fetchBooks = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const offset = (page - 1) * 10;
      const response = await query<{ listBooks: PaginatedResponse<Book> }>(
        LIST_BOOKS_QUERY,
        {
          offset,
          limit: 10,
          search,
        }
      );
      setBooks(response.listBooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBook = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this book?')) return;

    try {
      await query(REMOVE_BOOK_MUTATION, { id });
      fetchBooks(books?.pageInfo.currentPage || 1, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove book');
    }
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

  useEffect(() => {
    fetchBooks(1, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchBooks(page, searchTerm);
  };

  const handleEditBook = (book: Book) => {
    navigate(`/admin/books/edit/${book.id}`, { state: { book } });
  };

  const filteredBooks =
    books?.data.filter((book) => {
      const matchesLanguage =
        !languageFilter || book.language === languageFilter;
      return matchesLanguage;
    }) || [];

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Books</h2>
            <Link
              to="/admin/books/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Book</span>
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search books..."
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
                <option value="PT_BR">Português (PT_BR)</option>
                <option value="ES">Español (ES)</option>
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
                      <th className="text-left py-3 px-4">Cover</th>
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Code</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Currency</th>
                      <th className="text-left py-3 px-4">Language</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Stock</th>
                      <th className="text-left py-3 px-4">Pages</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <img
                            src={getCoverFormatted(book.cover ?? '')}
                            alt={book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{book.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {book.description}
                            </p>
                            {book.singleSale && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Single Sale
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{book.code}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p>
                              {book.currency || 'BRL'} {book.price}
                            </p>
                            {book.physical && book.shippingPrice && (
                              <p className="text-xs text-gray-500">
                                + {book.currency || 'BRL'} {book.shippingPrice}{' '}
                                frete
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            {book.currency || 'BRL'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {book.language === 'ES' ? 'ES' : 'PT_BR'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              book.physical
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {book.physical ? 'Físico' : 'Digital'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {book.physical ? book.stock || 0 : 'N/A'}
                        </td>
                        <td className="py-3 px-4">{book.pages}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRemoveBook(book.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEditBook(book)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            {book.singleSale && (
                              <button
                                onClick={() => {
                                  const url = `${window.location.origin}/#/${getLocaleFromLanguage(book.language ?? Language.PT_BR)}/checkout?type=book&id=${book.id}`;
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

              {books &&
                filteredBooks.length === 0 &&
                books.data.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No books found</p>
                  </div>
                )}

              {filteredBooks.length === 0 && books && books.data.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No books match the selected filters
                  </p>
                </div>
              )}

              {books && filteredBooks.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {filteredBooks.length} books
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handlePageChange(books.pageInfo.currentPage - 1)
                      }
                      disabled={!books.pageInfo.hasPreviousPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm">
                      Page {books.pageInfo.currentPage} of{' '}
                      {books.pageInfo.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        handlePageChange(books.pageInfo.currentPage + 1)
                      }
                      disabled={!books.pageInfo.hasNextPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      title="Next page"
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
    </div>
  );
}
