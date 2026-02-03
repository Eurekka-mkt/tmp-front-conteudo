import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import type { AppDynamicContent, AppTypeEnum } from '../../types/appContent';
import { useApi } from '../../hooks/useApi';
import { AppContentModal } from './AppContentModal';

interface AppContentListProps {
  type: AppTypeEnum;
}

const LIST_CONTENT_QUERY = `
  query PublicGetAppDynamicContent {
    publicGetAppDynamicContent {
      id
      type
      active
      link
      image
      description
      title
    }
  }
`;

const DELETE_CONTENT_MUTATION = `
  mutation RemoveAppDynamicContent($id: ID!) {
    removeAppDynamicContent(id: $id)
  }
`;

const TOGGLE_ACTIVE_MUTATION = `
  mutation EditAppDynamicContent($id: ID!, $appDynamicContent: AppDynamicContentInput!) {
    editAppDynamicContent(id: $id, appDynamicContent: $appDynamicContent)
  }
`;

export function AppContentList({ type }: AppContentListProps) {
  const { query } = useApi();
  const [contents, setContents] = useState<AppDynamicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<AppDynamicContent | null>(null);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await query<{ publicGetAppDynamicContent: AppDynamicContent[] }>(
        LIST_CONTENT_QUERY
      );
      const allContents = response.publicGetAppDynamicContent || [];
      const filteredContents = allContents.filter(content => content.type === type);
      setContents(filteredContents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [type]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este conteúdo?')) return;

    try {
      await query(DELETE_CONTENT_MUTATION, { id });
      fetchContents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const content = contents.find(c => c.id === id);
      if (!content) return;

      const appDynamicContent = {
        type: content.type,
        active: !currentActive,
        link: content.link,
        image: content.image,
        description: content.description,
        title: content.title,
      };

      await query(TOGGLE_ACTIVE_MUTATION, { id, appDynamicContent });
      fetchContents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle active status');
    }
  };

  const handleEdit = (content: AppDynamicContent) => {
    setEditingContent(content);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingContent(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingContent(null);
    fetchContents();
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Gerenciar {getTypeLabel()}s
        </h3>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo {getTypeLabel()}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {contents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhum {getTypeLabel().toLowerCase()} cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <div
              key={content.id}
              className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
            >
              {content.image && (
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={content.image}
                    alt={content.title || 'Content image'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4">
                {content.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">{content.title}</h4>
                )}

                {content.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {content.description}
                  </p>
                )}

                {content.link && (
                  <a
                    href={content.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all block mb-3"
                  >
                    {content.link}
                  </a>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(content.id, content.active)}
                      className={`p-2 rounded-lg transition-colors ${
                        content.active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={content.active ? 'Desativar' : 'Ativar'}
                    >
                      {content.active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        content.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {content.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(content)}
                      className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-100"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AppContentModal
          type={type}
          content={editingContent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
