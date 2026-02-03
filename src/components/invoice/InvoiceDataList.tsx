import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { InvoiceData, PaginatedInvoiceData } from '../../types/invoice';
import { useApi } from '../../hooks/useApi';

const LIST_INVOICE_DATA_QUERY = `
  query ListInvoiceData($access: Access, $offset: Int, $limit: Int, $search: String, $minDate: String, $maxDate: String, $type: ProductType) {
  listInvoiceData(access: $access, offset: $offset, limit: $limit, search: $search, minDate: $minDate, maxDate: $maxDate, type: $type) {
      data {
        name
        email
        cpf
        currency
        value
        createdAt
        paidAt
        address
        title
        books {
          id
          title
          currency
          price
          physical
        }
        courses {
          id
          title
          currency
          price
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

export function InvoiceDataList() {
  const { query } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<PaginatedInvoiceData | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchInvoiceData = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const offset = (page - 1) * 20;
      const variables: any = {
        access: 'ADMIN',
        offset,
        limit: 20,
        search,
      };
      if (typeFilter) {
        variables.type = typeFilter;
      }
      if (minDate) {
        variables.minDate = minDate;
      }
      if (maxDate) {
        variables.maxDate = maxDate;
      }
      const response = await query<{ listInvoiceData: PaginatedInvoiceData }>(
        LIST_INVOICE_DATA_QUERY,
        variables
      );
      setInvoiceData(response.listInvoiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData(1, searchTerm);
  }, [searchTerm, typeFilter, minDate, maxDate]);

  const handlePageChange = (page: number) => {
    fetchInvoiceData(page, searchTerm);
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(Number(value ?? 0) / 100);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCEP = (cep: string) => {
    return cep ? cep.replace(/(\d{5})(\d{3})/, '$1-$2') : '';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = async () => {
    try {
      setExporting(true);
      
      // Buscar todos os dados para exportação
      const allData: InvoiceData[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const offset = (currentPage - 1) * 100;
        const variables: any = {
          access: 'ADMIN',
          offset,
          limit: 100,
          search: searchTerm,
        };
        if (typeFilter) {
          variables.type = typeFilter;
        }
        if (minDate) {
          variables.minDate = minDate;
        }
        if (maxDate) {
          variables.maxDate = maxDate;
        }
        const response = await query<{ listInvoiceData: PaginatedInvoiceData }>(
          LIST_INVOICE_DATA_QUERY,
          variables
        );

        allData.push(...response.listInvoiceData.data);
        hasMore = response.listInvoiceData.pageInfo.hasNextPage;
        currentPage++;
      }

      // Criar CSV
      const headers = [
        'Nome Completo',
        'CPF',
        'Valor Total (R$)',
        'Data do Pedido',
        'Data do Pagamento',
        'Logradouro',
        'Número',
        'Complemento',
        'Bairro',
        'CEP',
        'Cidade',
        'UF',
        'E-mail',
        'Nome do Serviço Prestado',
        'Livros',
        'Cursos'
      ];

      const csvContent = [
        headers.join(','),
        ...allData.map(item => [
          `"${item.name}"`,
          `"${formatCPF(item.cpf)}"`,
          `"${formatCurrency(item.value, item.currency)}"`,
          `"${formatDate(item.createdAt)}"`,
          `"${formatDate(item.paidAt)}"`,
          `"${item.address.street}"`,
          `"${item.address.number}"`,
          `"${item.address.complement || ''}"`,
          `"${item.address.neighborhood}"`,
          `"${formatCEP(item.address.zip)}"`,
          `"${item.address.city}"`,
          `"${item.address.state}"`,
          `"${item.email}"`,
          `"${item.title}"`,
          `"${item.books?.map(book => `${book.title} (${book.currency} ${book.price}${book.physical ? ' - Físico' : ' - Digital'})`).join('; ') || ''}"`,
          `"${item.courses?.map(course => `${course.title} (${course.currency} ${course.price})`).join('; ') || ''}"`
        ].join(','))
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dados-nota-fiscal-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Dados para Nota Fiscal</h2>
            <button
              onClick={exportToCSV}
              disabled={exporting || !invoiceData?.data.length}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              <span>{exporting ? 'Exportando...' : 'Exportar CSV'}</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Tipo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos os Tipos</option>
                <option value="BOOK">Livros</option>
                <option value="COURSE">Cursos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={minDate}
                onChange={(e) => setMinDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={maxDate}
                onChange={(e) => setMaxDate(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium">Nome Completo</th>
                      <th className="text-left py-3 px-4 font-medium">CPF</th>
                      <th className="text-left py-3 px-4 font-medium">Valor Total</th>
                      <th className="text-left py-3 px-4 font-medium">Data do Pedido</th>
                      <th className="text-left py-3 px-4 font-medium">Data do Pagamento</th>
                      <th className="text-left py-3 px-4 font-medium">Endereço</th>
                      <th className="text-left py-3 px-4 font-medium">E-mail</th>
                      <th className="text-left py-3 px-4 font-medium">Serviço</th>
                      <th className="text-left py-3 px-4 font-medium">Livros</th>
                      <th className="text-left py-3 px-4 font-medium">Cursos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData?.data.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono">{formatCPF(item.cpf)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-green-600">
                            {formatCurrency(item.value, item.currency)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{formatDate(item.createdAt)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">{formatDate(item.paidAt)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm space-y-1">
                            <div>{item.address.street}, {item.address.number}</div>
                            {item.address.complement && (
                              <div className="text-gray-500">{item.address.complement}</div>
                            )}
                            <div>{item.address.neighborhood}</div>
                            <div>{formatCEP(item.address.zip)} - {item.address.city}/{item.address.state}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-blue-600">{item.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.title}</div>
                        </td>
                        <td className="py-3 px-4">
                          {item.books && item.books.length > 0 ? (
                            <div className="space-y-1">
                              {item.books.map((book, bookIndex) => (
                                <div key={bookIndex} className="text-sm">
                                  <div className="font-medium">{book.title}</div>
                                  <div className="text-gray-500">
                                    {formatCurrency(book.price * 100, book.currency)} 
                                    {book.physical ? ' - Físico' : ' - Digital'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.courses && item.courses.length > 0 ? (
                            <div className="space-y-1">
                              {item.courses.map((course, courseIndex) => (
                                <div key={courseIndex} className="text-sm">
                                  <div className="font-medium">{course.title}</div>
                                  <div className="text-gray-500">
                                    {formatCurrency(course.price * 100, course.currency)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invoiceData && invoiceData.data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum dado encontrado</p>
                </div>
              )}

              {invoiceData && invoiceData.data.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {invoiceData.data.length} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(invoiceData.pageInfo.currentPage - 1)}
                      disabled={!invoiceData.pageInfo.hasPreviousPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm">
                      Página {invoiceData.pageInfo.currentPage} de {invoiceData.pageInfo.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(invoiceData.pageInfo.currentPage + 1)}
                      disabled={!invoiceData.pageInfo.hasNextPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Próxima página"
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