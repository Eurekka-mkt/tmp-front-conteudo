import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Trash2, Edit, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { News, PaginatedResponse } from '../../types/content';
import { useApi } from '../../hooks/useApi';
import { UploadInstagramPostModal } from './UploadInstagramPostModal';

const LIST_NEWS_QUERY = `
  query ListNews($offset: Int, $limit: Int, $search: String) {
    listNews(offset: $offset, limit: $limit, search: $search, access: ADMIN) {
      data {
        id
        title
        slug
        type
        createdAt
        images
        image
        video
        scheduledFor
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

const REMOVE_NEWS_MUTATION = `
  mutation RemoveNews($id: ID!) {
    removeNews(id: $id)
  }
`;

export function NewsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<PaginatedResponse<News> | null>(null);

  const [postingNew, setPostingNew] = useState<News>()
  const { query } = useApi();

  const fetchNews = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const offset = (page - 1) * 10;
      const response = await query<{ listNews: PaginatedResponse<News> }>(
        LIST_NEWS_QUERY,
        {
          offset,
          limit: 10,
          search,
        }
      );
      setNews(response.listNews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNews = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this news item?')) return;

    try {
      await query(REMOVE_NEWS_MUTATION, { id });
      fetchNews(news?.pageInfo.currentPage || 1, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove news');
    }
  };
  

  useEffect(() => {
    fetchNews(1, searchTerm);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchNews(page, searchTerm);
  };

  const getMediaPreview = (item: News) => {
    switch (item.type) {
      case 'CAROUSEL':
        return item.images?.[0] ? (
          <div className="relative">
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-32 h-20 object-cover rounded"
            />
            {item.images.length > 1 && (
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{item.images.length - 1}
              </span>
            )}
          </div>
        ) : null;
      case 'IMAGE':
        return item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-32 h-20 object-cover rounded"
          />
        ) : null;
      case 'VIDEO':
        return item.video ? (
          <div className="w-32 h-20 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500">Video</span>
          </div>
        ) : null;
    }
  };

  return (
    <div className="p-6">

      {postingNew &&
        <UploadInstagramPostModal
          onClose={() => setPostingNew(undefined)}
          postId={postingNew.id}
      />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">News Posts</h2>
            <Link 
              to="/admin/posts/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Post</span>
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
              placeholder="Search news..."
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
                      <th className="text-left py-3 px-4">Media</th>
                      <th className="text-left py-3 px-4">Titulo</th>
                      <th className="text-left py-3 px-4">Tipo</th>
                      <th className="text-left py-3 px-4">Criado em</th>
                      <th className="text-left py-3 px-4">Agendado Para</th>
                      <th className="text-left py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {news?.data.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {getMediaPreview(item)}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-500">{item.slug}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.createdAt && new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {item.scheduledFor && new Date(item.scheduledFor).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                          <button
                              onClick={() => setPostingNew(item)}
                              className="p-2 text-purple-600 hover:bg-red-50 rounded-lg"
                            >
                              <Upload className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRemoveNews(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <Link
                              to={`/admin/posts/edit/${item.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {news && news.data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No news posts found</p>
                </div>
              )}

              {news && news.data.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {news.data.length} posts
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(news.pageInfo.currentPage - 1)}
                      disabled={!news.pageInfo.hasPreviousPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm">
                      Page {news.pageInfo.currentPage} of {news.pageInfo.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(news.pageInfo.currentPage + 1)}
                      disabled={!news.pageInfo.hasNextPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
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