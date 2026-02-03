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
import { useApi } from '../../hooks/useApi';
import { Combo, ComboStatus, PaginatedCombos } from '../../types/combo';

const LIST_COMBOS_QUERY = `
  query ListCombos($access: Access!, $offset: Int, $limit: Int, $search: String, $language: Language) {
    listCombos(access: $access, offset: $offset, limit: $limit, search: $search, language: $language) {
      data {
        id
        title
        description
        cover
        slug
        status
        price
        currency
        language
        singleSale
        bookIds
        courseIds
        cis {
          value
          locale
        }
        meds {
          value
        }
        orderBump {
          type
          data
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

const REMOVE_COMBO_MUTATION = `
  mutation RemoveCombo($removeComboId: ID!) {
    removeCombo(id: $removeComboId)
  }
`;

export function ComboList() {
  const navigate = useNavigate();
  const { query } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [combos, setCombos] = useState<PaginatedCombos | null>(null);

  const fetchCombos = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const offset = (page - 1) * 10;

      const variables: Record<string, any> = { access: 'ADMIN', offset, limit: 10, search };
      if (languageFilter) variables.language = languageFilter;

      const response = await query<{ listCombos: PaginatedCombos }>(
        LIST_COMBOS_QUERY,
        variables
      );
      setCombos(response.listCombos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch combos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCombo = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este combo?')) return;

    try {
      await query(REMOVE_COMBO_MUTATION, { removeComboId: id });
      fetchCombos(combos?.pageInfo.currentPage || 1, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove combo');
    }
  };

  useEffect(() => {
    fetchCombos(1, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, languageFilter]);

  const handlePageChange = (page: number) => {
    fetchCombos(page, searchTerm);
  };

  const handleEditCombo = (combo: Combo) => {
    navigate(`/admin/combos/edit/${combo.id}`, { state: { combo } });
  };

  const getLocaleFromLanguage = (lang: string) => {
    switch (lang) {
      case 'ES':
        return 'es';
      case 'PT_BR':
      default:
        return 'br';
    }
  };

  const items = combos?.data ?? [];

  return (
    <div className="p-4 lg:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 lg:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold">Combos</h2>
            <Link
              to="/admin/combos/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Combo</span>
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
                  placeholder="Buscar combos..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>

              <div className="flex gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idioma
                  </label>
                  <select
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Todos os Idiomas</option>
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
                          <th className="text-left py-3 px-4">Título</th>
                          <th className="text-left py-3 px-4">Slug</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Preço</th>
                          <th className="text-left py-3 px-4">Moeda</th>
                          <th className="text-left py-3 px-4">Idioma</th>
                          <th className="text-left py-3 px-4">Itens</th>
                          <th className="text-left py-3 px-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((combo) => (
                          <tr
                            key={combo.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{combo.title}</p>
                                {combo.singleSale && (
                                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Venda Direta
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">{combo.slug}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                combo.status === ComboStatus.ACTIVE
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {combo.status === ComboStatus.ACTIVE ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {combo.currency} {combo.price}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                {combo.currency}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {combo.language}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm">
                                {combo.courseIds.length > 0 && (
                                  <div>{combo.courseIds.length} curso(s)</div>
                                )}
                                {combo.bookIds.length > 0 && (
                                  <div>{combo.bookIds.length} livro(s)</div>
                                )}
                                {combo.cis.length > 0 && (
                                  <div>{combo.cis.length} CI(s)</div>
                                )}
                                {combo.meds.length > 0 && (
                                  <div>{combo.meds.length} consulta(s)</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditCombo(combo)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveCombo(combo.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {combo.singleSale && (
                                  <button
                                    onClick={() => {
                                      const url = `${window.location.origin}/#/${getLocaleFromLanguage(combo.language)}/checkout?type=combo&id=${combo.id}`;
                                      navigator.clipboard.writeText(url);
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                    title="Copiar link de pagamento"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="w-4 h-4"
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

                  {combos && items.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Mostrando {items.length} combos
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handlePageChange(combos.pageInfo.currentPage - 1)
                          }
                          disabled={!combos.pageInfo.hasPreviousPage}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm">
                          Página {combos.pageInfo.currentPage} de{' '}
                          {combos.pageInfo.totalPages}
                        </span>
                        <button
                          onClick={() =>
                            handlePageChange(combos.pageInfo.currentPage + 1)
                          }
                          disabled={!combos.pageInfo.hasNextPage}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {combos && items.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nenhum combo encontrado</p>
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