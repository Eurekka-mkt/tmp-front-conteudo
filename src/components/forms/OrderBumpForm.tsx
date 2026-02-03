import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import type { OrderBumpInput } from '../../types/content';
import { useApi } from '../../hooks/useApi';

interface OrderBumpFormProps {
  orderBumps: OrderBumpInput[];
  onChange: (orderBumps: OrderBumpInput[]) => void;
}

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

// CI and MED value options
const CI_VALUES = {
  BR: [
    { value: 140, currency: 'BRL', label: 'BRL 140' },
    { value: 200, currency: 'BRL', label: 'BRL 200' }
  ],
  ES: [
    { value: 30, currency: 'USD', label: 'USD 30' }
  ]
};

const MED_VALUES = [
  { value: 300, currency: 'BRL', label: 'BRL 300' }
];

export function OrderBumpForm({ orderBumps, onChange }: OrderBumpFormProps) {
  const { query } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'COURSE' | 'BOOK' | 'CI' | 'MED'>('COURSE');
  const [isSearching, setIsSearching] = useState(false);

  const handleAddOrderBump = () => {
    onChange([...orderBumps, { type: 'COURSE', data: '' }]);
  };

  const handleRemoveOrderBump = (index: number) => {
    onChange(orderBumps.filter((_, i) => i !== index));
  };

  const handleUpdateOrderBump = (index: number, field: keyof OrderBumpInput, value: string) => {
    const updated = orderBumps.map((bump, i) =>
      i === index ? { ...bump, [field]: value } : bump
    );
    onChange(updated);
  };

  const handleTypeChange = (index: number, newType: string) => {
    const updated = orderBumps.map((bump, i) =>
      i === index ? { ...bump, type: newType, data: '' } : bump
    );
    onChange(updated);
  };

  const handleSearch = async (bump: OrderBumpInput) => {
    if (!searchTerm.trim()) return;

    try {
      setIsSearching(true);
      const searchQuery = bump.type === 'COURSE'
        ? SEARCH_COURSES
        : SEARCH_BOOKS;

      const response = await query(searchQuery, {
        search: searchTerm,
        limit: 10,
      });

      const results = bump.type === 'COURSE'
        ? response.listCourses.data 
        : response.listBooks.data;

      setSearchResults(results.map((item: { id: string; title: string; price?: number; currency?: string }) => ({ ...item, type: searchType })));
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProduct = (product: any, bumpIndex: number) => {
    handleUpdateOrderBump(bumpIndex, 'type', product.type);
    handleUpdateOrderBump(bumpIndex, 'data', product.id);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSelectCIValue = (bumpIndex: number, locale: string, valueOption: any) => {
    const ciData = {
      value: valueOption.value,
      locale: locale
    };
    handleUpdateOrderBump(bumpIndex, 'type', "CI");
    handleUpdateOrderBump(bumpIndex, 'data', JSON.stringify(ciData));
  };

  const handleSelectMEDValue = (bumpIndex: number, valueOption: any) => {
    const medData = {
      value: valueOption.value
    };
    handleUpdateOrderBump(bumpIndex, 'type', "MED");
    handleUpdateOrderBump(bumpIndex, 'data', JSON.stringify(medData));
  };

  const getProductInfo = (bump: OrderBumpInput) => {
    try {
      if (bump.type === 'CI') {
        let data = JSON.parse(bump.data);
        return `CI - ${data.locale} - ${data.value} ${data.locale === 'BR' ? 'BRL' : 'USD'}`;
      } else if (bump.type === 'MED') {
        const data = JSON.parse(bump.data);
        return `MED - ${data.value} BRL`;
      } else {
        const product = JSON.parse(bump.data);
        return `${typeof product === 'string' ? product : product.id} - ${product.title || 'Produto não encontrado'}`;
      }
    } catch {
      return bump.data || 'Não configurado';
    }
  };

  const renderProductConfiguration = (bump: OrderBumpInput, index: number) => {
    if (bump.type === 'CI') {
      return (
        <div className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locale
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(CI_VALUES).map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => {
                    // Reset data when locale changes
                    handleUpdateOrderBump(index, 'data', '');
                  }}
                  className="p-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  {locale}
                </button>
              ))}
            </div>
          </div> */}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valores Disponíveis
            </label>
            <div className="space-y-2">
              {Object.entries(CI_VALUES).map(([locale, values]) => (
                <div key={locale}>
                  <p className="text-sm font-medium text-gray-600 mb-1">{locale}:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {values.map((valueOption, valueIndex) => (
                      <button
                        key={valueIndex}
                        type="button"
                        onClick={() => handleSelectCIValue(index, locale, valueOption)}
                        className="p-2 border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300"
                      >
                        {valueOption.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (bump.type === 'MED') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor Disponível
          </label>
          <div className="grid grid-cols-1 gap-2">
            {MED_VALUES.map((valueOption, valueIndex) => (
              <button
                key={valueIndex}
                type="button"
                onClick={() => handleSelectMEDValue(index, valueOption)}
                className="p-2 border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300"
              >
                {valueOption.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // For COURSE and BOOK types, show the search interface
    return (
      <div className="border-t pt-4">
        <div className="flex space-x-2 mb-2">
          <select
            value={bump.type}
            onChange={(e) => setSearchType(e.target.value as 'COURSE' | 'BOOK' | 'CI' | 'MED')}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled
          >
            <option value="COURSE">Cursos</option>
            <option value="BOOK">Livros</option>
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
            onClick={() => handleSearch(bump)}
            disabled={isSearching || !searchTerm.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {searchResults.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product, index)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
              >
                <div className="font-medium">{product.title}</div>
                <div className="text-sm text-gray-500">
                  {product.type} - R$ {product.price}
                  {product.currency && ` ${product.currency}`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Order Bumps</h3>
        <button
          type="button"
          onClick={handleAddOrderBump}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Order Bump</span>
        </button>
      </div>

      {orderBumps.length > 0 && (
        <div className="space-y-4">
          {orderBumps.map((bump, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Order Bump {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveOrderBump(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={bump.type}
                    onChange={(e) => handleTypeChange(index, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="COURSE">Curso</option>
                    <option value="BOOK">Livro</option>
                    <option value="CI">CI (Conversa Inicial)</option>
                    <option value="MED">MED (Consulta Médica)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto
                  </label>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                    {getProductInfo(bump)}
                  </div>
                </div>
              </div>

              {/* Configuration Section */}
              {renderProductConfiguration(bump, index)}
            </div>
          ))}
        </div>
      )}

      {orderBumps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum order bump configurado</p>
          <p className="text-sm">Order bumps são produtos recomendados durante o checkout</p>
        </div>
      )}
    </div>
  );
}