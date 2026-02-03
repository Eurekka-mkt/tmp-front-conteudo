import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import type { AppDynamicContent, AppTypeEnum, AppDynamicContentInput } from '../../types/appContent';
import { useApi } from '../../hooks/useApi';

interface AppContentModalProps {
  type: AppTypeEnum;
  content?: AppDynamicContent | null;
  onClose: () => void;
}

const CREATE_CONTENT_MUTATION = `
  mutation CreateAppDynamicContent($appDynamicContent: AppDynamicContentInput!) {
    createAppDynamicContent(appDynamicContent: $appDynamicContent)
  }
`;

const UPDATE_CONTENT_MUTATION = `
  mutation EditAppDynamicContent($id: ID!, $appDynamicContent: AppDynamicContentInput!) {
    editAppDynamicContent(id: $id, appDynamicContent: $appDynamicContent)
  }
`;

export function AppContentModal({ type, content, onClose }: AppContentModalProps) {
  const { query } = useApi();
  const [formData, setFormData] = useState<AppDynamicContentInput>({
    type,
    active: content?.active ?? false,
    title: content?.title ?? '',
    description: content?.description ?? '',
    link: content?.link ?? '',
    image: content?.image ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTypeLabel = () => {
    switch (type) {
      case 'POP_UP':
        return 'Pop-up';
      case 'BANNER':
        return 'Banner';
      case 'BUTTON':
        return 'Botão';
      default:
        return type;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (content) {
        await query(UPDATE_CONTENT_MUTATION, {
          id: content.id,
          appDynamicContent: formData,
        });
      } else {
        await query(CREATE_CONTENT_MUTATION, {
          appDynamicContent: formData,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {content ? 'Editar' : 'Novo'} {getTypeLabel()}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">Ativo</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o título"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite a descrição"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          {formData.image && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prévia da Imagem
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-64 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem+Invalida';
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
