import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { BlogPost, PostInput } from '../../types/blog';
import { useApi } from '../../hooks/useApi';

interface BlogPostEditModalProps {
  post: BlogPost;
  onClose: () => void;
  onPostUpdated: () => void;
}

const EDIT_POST_MUTATION = `
  mutation EditPost($editPostId: ID!, $post: PostInput) {
    editPost(id: $editPostId, post: $post)
  }
`;

export function BlogPostEditModal({ post, onClose, onPostUpdated }: BlogPostEditModalProps) {
  const { query } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState(post.featured_media?.image || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const postInput: PostInput = {
        featured_media: {
          ...post.featured_media,
          image: featuredImage
        }
      };

      await query(EDIT_POST_MUTATION, {
        editPostId: post.id,
        post: postInput
      });

      onPostUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Editar Post</h2>
              <p className="text-gray-600">Apenas a imagem destacada pode ser editada</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Post Information (Read-only) */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Informações do Post</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título
                    </label>
                    <div className="p-2 bg-white border rounded-lg text-gray-600">
                      {post.title.rendered}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug
                    </label>
                    <div className="p-2 bg-white border rounded-lg text-gray-600">
                      {post.slug}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="p-2 bg-white border rounded-lg">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          post.status === 'publish' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status === 'publish' ? 'Publicado' : 'Rascunho'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data
                      </label>
                      <div className="p-2 bg-white border rounded-lg text-gray-600 text-sm">
                        {formatDate(post.date)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conteúdo (Prévia)
                    </label>
                    <div className="p-2 bg-white border rounded-lg text-gray-600 text-sm max-h-32 overflow-y-auto">
                      {stripHtml(post.content.rendered).substring(0, 300)}...
                    </div>
                  </div>

                  {post.categories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categorias
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {post.categories.map((category) => (
                          <span
                            key={category.id}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {post.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Section */}
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-blue-900">Seção Editável</h3>
                  
                  <div>
                    <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-2">
                      Imagem Destacada (URL)
                    </label>
                    <input
                      type="url"
                      id="featuredImage"
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {featuredImage && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prévia da Imagem
                      </label>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={featuredImage}
                          alt="Prévia"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}