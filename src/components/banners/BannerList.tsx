import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Banner, PaginatedResponse } from '../../types/content';
import { useApi } from '../../hooks/useApi';

const LIST_BANNERS_QUERY = `
  query ListBanners($offset: Int, $limit: Int, $search: String) {
    listBanners(offset: $offset, limit: $limit, search: $search, access: ADMIN) {
      data {
        id
        image
        link
        type
        active
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

const REMOVE_BANNER_MUTATION = `
  mutation RemoveBanner($id: ID!) {
    removeBanner(id: $id)
  }
`;

export function BannerList() {
  const navigate = useNavigate();
  const { query } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banners, setBanners] = useState<PaginatedResponse<Banner> | null>(null);

  const fetchBanners = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const offset = (page - 1) * 10;
      const response = await query<{ listBanners: PaginatedResponse<Banner> }>(
        LIST_BANNERS_QUERY,
        {
          offset,
          limit: 10,
          search,
        }
      );
      setBanners(response.listBanners);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this banner?')) return;

    try {
      await query(REMOVE_BANNER_MUTATION, { id });
      fetchBanners(banners?.pageInfo.currentPage || 1, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove banner');
    }
  };

  useEffect(() => {
    fetchBanners(1, searchTerm);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchBanners(page, searchTerm);
  };

  const handleEditBanner = (banner: Banner) => {
    navigate(`/admin/banners/edit/${banner.id}`, { state: { banner } });
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Banners</h2>
            <Link 
              to="/admin/banners/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Banner</span>
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
              placeholder="Search banners..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners?.data.map((banner) => (
                  <div
                    key={banner.id}
                    className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video relative">
                      <img
                        src={banner.image}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => handleRemoveBanner(banner.id)}
                          className="p-2 bg-white rounded-lg shadow-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditBanner(banner)}
                          className="p-2 bg-white rounded-lg shadow-sm text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          banner.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {banner.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm font-medium text-gray-500">
                          {banner.type}
                        </span>
                      </div>
                      <a
                        href={banner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {banner.link}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {banners && banners.data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No banners found</p>
                </div>
              )}

              {banners && banners.data.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {banners.data.length} banners
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(banners.pageInfo.currentPage - 1)}
                      disabled={!banners.pageInfo.hasPreviousPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm">
                      Page {banners.pageInfo.currentPage} of {banners.pageInfo.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(banners.pageInfo.currentPage + 1)}
                      disabled={!banners.pageInfo.hasNextPage}
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