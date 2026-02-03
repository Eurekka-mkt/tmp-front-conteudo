import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Search } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useApi } from '../../hooks/useApi';
import { ComboInput, ComboStatus, CiProductInput, MedProductInput, Currency } from '../../types/combo';
import { OrderBumpForm } from '../forms/OrderBumpForm';

const CREATE_COMBO_MUTATION = `
  mutation CreateCombo($combo: ComboInput) {
    createCombo(combo: $combo)
  }
`;

const SEARCH_COURSES = `
  query ListCourses($search: String, $limit: Int) {
    listCourses(search: $search, limit: $limit, access: ADMIN) {
      data {
        id
        title
        price
        currency
      }
    }
  }
`;

const SEARCH_BOOKS = `
  query ListBooks($search: String, $limit: Int) {
    listBooks(search: $search, limit: $limit, access: ADMIN) {
      data {
        id
        title
        price
      }
    }
  }
`;

export function ComboForm() {
  const navigate = useNavigate();
  const { query } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComboInput>({
    id: '',
    title: '',
    slug: '',
    description: '',
    status: ComboStatus.ACTIVE,
    price: 0,
    cover: '',
    singleSale: false,
    currency: Currency.BRL,
    language: 'PT_BR',
    bookIds: [],
    courseIds: [],
    cis: [],
    meds: [],
    orderBump: [],
  });

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'course' | 'book'>('course');
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await query(CREATE_COMBO_MUTATION, { combo: formData });
      navigate('/admin/combos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create combo');
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
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const searchQuery = searchType === 'course' ? SEARCH_COURSES : SEARCH_BOOKS;
      
      const response = await query(searchQuery, {
        search: searchTerm,
        limit: 10,
      });

      const results = searchType === 'course' 
        ? response.listCourses.data 
        : response.listBooks.data;

      setSearchResults(results.map((item: any) => ({ ...item, type: searchType })));
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddProduct = (product: any) => {
    if (product.type === 'course') {
      if (!formData.courseIds.includes(product.id)) {
        setFormData(prev => ({
          ...prev,
          courseIds: [...prev.courseIds, product.id]
        }));
      }
    } else {
      if (!formData.bookIds.includes(product.id)) {
        setFormData(prev => ({
          ...prev,
          bookIds: [...prev.bookIds, product.id]
        }));
      }
    }
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleRemoveProduct = (id: string, type: 'course' | 'book') => {
    if (type === 'course') {
      setFormData(prev => ({
        ...prev,
        courseIds: prev.courseIds.filter(courseId => courseId !== id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bookIds: prev.bookIds.filter(bookId => bookId !== id)
      }));
    }
  };

  const handleAddCI = () => {
    setFormData(prev => ({
      ...prev,
      cis: [...prev.cis, { value: 0, locale: 'BR' }]
    }));
  };

  const handleUpdateCI = (index: number, ci: CiProductInput) => {
    setFormData(prev => ({
      ...prev,
      cis: prev.cis.map((item, i) => i === index ? ci : item)
    }));
  };

  const handleRemoveCI = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cis: prev.cis.filter((_, i) => i !== index)
    }));
  };

  const handleAddMED = () => {
    setFormData(prev => ({
      ...prev,
      meds: [...prev.meds, { value: 0 }]
    }));
  };

  const handleUpdateMED = (index: number, med: MedProductInput) => {
    setFormData(prev => ({
      ...prev,
      meds: prev.meds.map((item, i) => i === index ? med : item)
    }));
  };

  const handleRemoveMED = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meds: prev.meds.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/combos')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold">Novo Combo</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título
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
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ],
                }}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="cover" className="block text-sm font-medium text-gray-700">
                Imagem de Capa (URL)
              </label>
              <input
                type="url"
                id="cover"
                name="cover"
                value={formData.cover}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {formData.cover && (
                <div className="mt-2">
                  <img
                    src={formData.cover}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Preço
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
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Moeda
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
                  Idioma
                </label>
                <select
                  id="language"
                  name="language"
                  required
                  value={formData.language}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PT_BR">Português (PT-BR)</option>
                  <option value="ES">Español (ES)</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={ComboStatus.ACTIVE}>Ativo</option>
                  <option value={ComboStatus.INACTIVE}>Inativo</option>
                </select>
              </div>
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
                Venda Direta (Checkout Direto)
              </label>
            </div>

            {/* Product Search */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Adicionar Produtos</h3>
              <div className="flex space-x-2 mb-4">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'course' | 'book')}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="course">Cursos</option>
                  <option value="book">Livros</option>
                </select>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !searchTerm.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto mb-4">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-gray-500">
                        {product.type} - {product.currency || 'BRL'} {product.price}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Products */}
              <div className="space-y-4">
                {formData.courseIds.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Cursos Selecionados ({formData.courseIds.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.courseIds.map((courseId) => (
                        <div key={courseId} className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                          <span className="text-sm">{courseId}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(courseId, 'course')}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.bookIds.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Livros Selecionados ({formData.bookIds.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.bookIds.map((bookId) => (
                        <div key={bookId} className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                          <span className="text-sm">{bookId}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(bookId, 'book')}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CI Products */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Conversas Iniciais (CI)</h3>
                <button
                  type="button"
                  onClick={handleAddCI}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  disabled={formData.cis.length > 0}
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar CI</span>
                </button>
              </div>
              
              {formData.cis.map((ci, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ci.value}
                      onChange={(e) => handleUpdateCI(index, { ...ci, value: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localização
                    </label>
                    <select
                      value={ci.locale}
                      onChange={(e) => handleUpdateCI(index, { ...ci, locale: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="BR">BR</option>
                      <option value="ES">ES</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCI(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* MED Products */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Consultas Médicas (MED)</h3>
                <button
                  type="button"
                  onClick={handleAddMED}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  disabled={formData.meds.length > 0}
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar MED</span>
                </button>
              </div>
              
              {formData.meds.map((med, index) => (
                <div key={index} className="flex items-center space-x-4 mb-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={med.value}
                      onChange={(e) => handleUpdateMED(index, { value: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMED(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Bump */}
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
                {loading ? 'Criando...' : 'Criar Combo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}