import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, Edit, Eye } from 'lucide-react';
import type { BlogPost, PaginatedBlogPosts } from '../../types/blog';
import { useApi } from '../../hooks/useApi';
import { BlogPostEditModal } from './BlogPostEditModal';

const LIST_POSTS_QUERY = `
  query PublicListPosts($offset: Int, $limit: Int, $search: String) {
    publicListPosts(offset: $offset, limit: $limit, search: $search) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        currentPage
        totalPages
      }
      data {
        id
        date
        date_gmt
        slug
        status
        title {
          rendered
          protected
        }
        content {
          rendered
          protected
        }
        featured_media {
          medium {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          large {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          thumbnail {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          medium_large {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          related_thumb {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          archive_thumb {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          post_main_image_fullwidth {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          thumb_slider {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          thumb_card {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          thumb_card_mobile {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          web_stories_poster_portrait {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          web_stories_publisher_logo {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          web_stories_thumbnail {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          full {
            file
            width
            heigth
            filesize
            mime_type
            source_url
          }
          attr {
            alt
            title
            id
          }
          image
        }
        meta {
          custom_field
        }
        categories {
          id
          name
          slug
          description
        }
        tags {
          id
          name
          slug
          description
        }
        link
      }
    }
  }
`;

const REMOVE_POST_MUTATION = `
  mutation RemovePost($removePostId: ID!) {
    removePost(id: $removePostId)
  }
`;

export function BlogPostList() {
  const { query } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PaginatedBlogPosts | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);

  const fetchPosts = async (search: string, page: number = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * 10;
      const response = await query<{ publicListPosts: PaginatedBlogPosts }>(
        LIST_POSTS_QUERY,
        {
          search,
          offset,
          limit: 10,
        },
        false // Public query
      );
      setPosts(response.publicListPosts);
      setFilteredPosts(response.publicListPosts.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePost = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este post?')) return;
    try {
      await query(REMOVE_POST_MUTATION, { removePostId: id });
      fetchPosts(debouncedSearchTerm, posts?.pageInfo.currentPage || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove post');
    }
  };

  const handlePostUpdated = () => {
    fetchPosts(debouncedSearchTerm, posts?.pageInfo.currentPage || 1);
    setSelectedPost(null);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchPosts(debouncedSearchTerm, 1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchPosts('', 1);
  }, []);

  const handlePageChange = (page: number) => {
    fetchPosts(debouncedSearchTerm, page);
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
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Posts do Blog</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Buscar posts..."
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Imagem</th>
                      <th className="text-left py-3 px-4">Título</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Data</th>
                      <th className="text-left py-3 px-4">Categorias</th>
                      <th className="text-left py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {post.featured_media?.image ? (
                            <img
                              src={post.featured_media.image}
                              alt={post.title.rendered}
                              className="w-16 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-xs text-gray-500">Sem imagem</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium line-clamp-2">{post.title.rendered}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {stripHtml(post.content.rendered).substring(0, 100)}...
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            post.status === 'publish' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.status === 'publish' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {formatDate(post.date)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {post.categories.slice(0, 2).map((category) => (
                              <span
                                key={category.id}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                              >
                                {category.name}
                              </span>
                            ))}
                            {post.categories.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                +{post.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <a
                              href={post.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Ver post"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => setSelectedPost(post)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemovePost(post.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remover"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {posts && posts.data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum post encontrado</p>
                </div>
              )}

              {posts && posts.data.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {filteredPosts.length} posts
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(posts.pageInfo.currentPage - 1)}
                      disabled={!posts.pageInfo.hasPreviousPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm">
                      Página {posts.pageInfo.currentPage} de {posts.pageInfo.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(posts.pageInfo.currentPage + 1)}
                      disabled={!posts.pageInfo.hasNextPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
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

      {selectedPost && (
        <BlogPostEditModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}