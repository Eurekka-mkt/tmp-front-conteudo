import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import type { NewsInput } from '../../types/content';
import { useApi } from '../../hooks/useApi';
import moment from 'moment';

const CREATE_NEWS_MUTATION = `
  mutation CreateNews($news: NewsInput!) {
    createNews(news: $news)
  }
`;

export function NewsForm() {
  const navigate = useNavigate();
  const { query } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewsInput>({
    title: '',
    slug: '',
    type: 'IMAGE',
    image: '',
    images: [],
    video: '',
    scheduledFor: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await query(CREATE_NEWS_MUTATION, { news: {
        ...formData,
        ...(formData.scheduledFor && {
          scheduledFor: moment(formData.scheduledFor).startOf('day').toDate()
        })
      }});
      navigate('/admin/posts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create news post');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addCarouselImage = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ''],
    }));
  };

  const updateCarouselImage = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.map((img, i) => (i === index ? value : img)),
    }));
  };

  const removeCarouselImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/posts')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold">Create New Post</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
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

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Post Type
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="IMAGE">Single Image</option>
                <option value="CAROUSEL">Image Carousel</option>
                <option value="VIDEO">Video</option>
              </select>
            </div>

            <div>
              <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700">
                Agendar publicação para Date de
              </label>
              <input
                type="date"
                id="scheduledFor"
                name="scheduledFor"
                value={formData.scheduledFor}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {formData.type === 'IMAGE' && (
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  required
                  value={formData.image}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="max-w-md rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {formData.type === 'CAROUSEL' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Carousel Images
                  </label>
                  <button
                    type="button"
                    onClick={addCarouselImage}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Image</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.images?.map((image, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => updateCarouselImage(index, e.target.value)}
                        placeholder="Image URL"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeCarouselImage(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {formData.images?.map((image, index) => (
                    image && (
                      <img
                        key={index}
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                    )
                  ))}
                </div>
              </div>
            )}

            {formData.type === 'VIDEO' && (
              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-700">
                  Video URL
                </label>
                <input
                  type="url"
                  id="video"
                  name="video"
                  required
                  value={formData.video}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}