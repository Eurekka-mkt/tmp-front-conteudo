import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Book, BookInput } from '../../types/content';
import { useApi } from '../../hooks/useApi';
import { getCoverFormatted } from '../../pages/public/BookList';
import { OrderBumpForm } from '../forms/OrderBumpForm';
import { Language } from './BookList';

const EDIT_BOOK_MUTATION = `
  mutation EditBook($id: ID!, $book: BookInput!) {
    editBook(id: $id, book: $book)
  }
`;

export function EditBookForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const book = location.state?.book as Book;
  const { query } = useApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookInput>({
    title: book?.title || '',
    description: book?.description || '',
    price: book?.price || 0,
    shippingPrice: book?.shippingPrice || 0,
    pages: book?.pages || 0,
    code: book?.code || '',
    salesLink: book?.salesLink || '',
    fileRef: book?.fileRef || '',
    cover: book?.cover || '',
    physical: book?.physical || false,
    stock: book?.stock || 0,
    singleSale: book?.singleSale || false,
    orderBump: book?.orderBump || [],
    currency: book?.currency || 'BRL',
    language: book?.language || 'PT_BR',
  });

  const [addStock, setAddStock] = useState<number>(0);

  if (!book) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="text-center text-red-600">
              Book data not found. Please go back to the book list and try again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      console.log("formData before submit:", formData);
      // Se addStock for maior que 0, envie para o backend junto com o restante dos dados
      const payload = {...formData, stock: addStock };
      await query(EDIT_BOOK_MUTATION, { id, book: payload });
      navigate('/admin/books');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
          ? (name === 'price' || name === 'shippingPrice'
            ? (parseFloat(value) || 0)
            : parseInt(value, 10) || 0)
          : value,
    }));
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/books')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold">Edit Book</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="shippingPrice" className="block text-sm font-medium text-gray-700">
                  Shipping Price
                </label>
                <input
                  type="number"
                  id="shippingPrice"
                  name="shippingPrice"
                  min="0"
                  step="0.01"
                  value={formData.shippingPrice}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  required
                  value={formData.language}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={Language.PT_BR}>Português (PT-BR)</option>
                  <option value={Language.ES}>Español (ES)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="pages" className="block text-sm font-medium text-gray-700">
                  Pages
                </label>
                <input
                  type="number"
                  id="pages"
                  name="pages"
                  required
                  min="0"
                  step="1"
                  value={formData.pages}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estoque atual
                </label>
                <div className="mt-1 mb-2 text-lg font-semibold">{formData.stock}</div>
                <label htmlFor="addStock" className="block text-sm font-medium text-gray-700">
                  Adicionar ao estoque
                </label>
                <input
                  type="number"
                  id="addStock"
                  name="addStock"
                  min={(formData?.stock ?? 0) > 0 ? -(formData?.stock ?? 0) : 0}
                  step="1"
                  value={addStock}
                  onChange={e => setAddStock(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Quantidade a adicionar"
                />
              </div>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Code
              </label>
              <input
                type="text"
                id="code"
                name="code"
                required
                value={formData.code}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="salesLink" className="block text-sm font-medium text-gray-700">
                Sales Link
              </label>
              <input
                type="url"
                id="salesLink"
                name="salesLink"
                value={formData.salesLink}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="fileRef" className="block text-sm font-medium text-gray-700">
                File Reference
              </label>
              <input
                type="text"
                id="fileRef"
                name="fileRef"
                required={!formData.physical}
                value={formData.fileRef}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="cover" className="block text-sm font-medium text-gray-700">
                Cover URL
              </label>
              <input
                type="url"
                id="cover"
                name="cover"
                required
                value={formData.cover}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {formData.cover && (
                <div className="mt-2">
                  <img
                    src={getCoverFormatted(formData.cover)}
                    alt="Cover preview"
                    className="w-32 h-40 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="physical"
                  name="physical"
                  checked={formData.physical}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="physical" className="ml-2 block text-sm text-gray-700">
                  Physical Book
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="singleSale"
                  name="singleSale"
                  checked={formData.singleSale}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="singleSale" className="ml-2 block text-sm text-gray-700">
                  Single Sale (Direct Checkout)
                </label>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <OrderBumpForm
                orderBumps={formData.orderBump || []}
                onChange={(orderBumps) => setFormData(prev => ({ ...prev, orderBump: orderBumps }))}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}