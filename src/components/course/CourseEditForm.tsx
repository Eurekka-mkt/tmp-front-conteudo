import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Course, CreateCourseInput, Currency, Language } from '../../types/course';
import { useApi } from '../../hooks/useApi';
import { CourseBasicInfo } from '../forms/CourseBasicInfo';
import { CourseStructureToggle } from '../forms/CourseStructureToggle';
import { SimpleLessonList } from '../forms/SimpleLessonList';
import { ModuleList } from '../forms/ModuleList';

const GET_COURSE_QUERY = `
  query GetCourse($id: ID!) {
    getCourse(id: $id) {
      id
      title
      slug
      description
      thumbnailUrl
      price
      currency
      language
      singleSale
      lessons {
        withModules
        lessons {
          title
          description
          video
          downloads {
            title
            file
            referenceLink
            size
            ext
          }
        }
        modules {
          title
          lessons {
            title
            description
            video
            downloads {
              title
              file
              referenceLink
              size
              ext
            }
          }
        }
      }
    }
  }
`;

export const EDIT_COURSE_MUTATION = `
  mutation EditCourse($id: ID!, $data: UpdateCourseInput!) {
    editCourse(id: $id, data: $data)
  }
`;

export function CourseEditForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { query } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withModules, setWithModules] = useState(false);
  const [formData, setFormData] = useState<CreateCourseInput>({
    title: '',
    slug: '',
    description: '',
    thumbnailUrl: '',
    singleSale: false,
    price: 0,
    currency: Currency.BRL,
    lessons: {
      withModules: false,
      lessons: [],
      modules: [],
    },
  });

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await query<{ getCourse: Course }>(GET_COURSE_QUERY, { id });
        const course = response.getCourse;
        
        setFormData({
          title: course.title || '',
          slug: course.slug || '',
          description: course.description || '',
          thumbnailUrl: course.thumbnailUrl || '',
          price: course.price || 0,
          currency: course.currency || Currency.BRL,
          language: course.language || Language.PT_BR,
          singleSale: course.singleSale || false,
          lessons: course.lessons || {
            withModules: false,
            lessons: [],
            modules: [],
          },
        });

        setWithModules(course.lessons?.withModules || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await query(EDIT_COURSE_MUTATION, { id, data: formData });
      navigate('/admin/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseFloat(value) 
          : value,
    }));
  };

  const addLesson = () => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        lessons: [
          ...(prev.lessons?.lessons || []),
          { title: '', description: '', video: '', downloads: [] },
        ],
      },
    }));
  };

  const updateLesson = (index: number, lessonData: Partial<any>) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        lessons: prev.lessons!.lessons!.map((lesson, i) =>
          i === index ? { ...lesson, ...lessonData } : lesson
        ),
      },
    }));
  };

  const removeLesson = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        lessons: prev.lessons!.lessons!.filter((_, i) => i !== index),
      },
    }));
  };

  const addModule = () => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        modules: [
          ...(prev.lessons?.modules || []),
          { title: '', lessons: [] },
        ],
      },
    }));
  };

  const updateModule = (moduleIndex: number, moduleData: Partial<any>) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        modules: prev.lessons!.modules!.map((module, i) =>
          i === moduleIndex ? { ...module, ...moduleData } : module
        ),
      },
    }));
  };

  const removeModule = (moduleIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        modules: prev.lessons!.modules!.filter((_, i) => i !== moduleIndex),
      },
    }));
  };

  const addLessonToModule = (moduleIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        modules: prev.lessons!.modules!.map((module, i) =>
          i === moduleIndex
            ? {
                ...module,
                lessons: [
                  ...(module.lessons || []),
                  { title: '', description: '', video: '', downloads: [] },
                ],
              }
            : module
        ),
      },
    }));
  };

  const updateModuleLesson = (
    moduleIndex: number,
    lessonIndex: number,
    lessonData: Partial<any>
  ) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        modules: prev.lessons!.modules!.map((module, i) =>
          i === moduleIndex
            ? {
                ...module,
                lessons: module.lessons!.map((lesson, j) =>
                  j === lessonIndex ? { ...lesson, ...lessonData } : lesson
                ),
              }
            : module
        ),
      },
    }));
  };

  const removeModuleLesson = (moduleIndex: number, lessonIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        modules: prev.lessons!.modules!.map((module, i) =>
          i === moduleIndex
            ? {
                ...module,
                lessons: module.lessons!.filter((_, j) => j !== lessonIndex),
              }
            : module
        ),
      },
    }));
  };

  const toggleModules = (enabled: boolean) => {
    setWithModules(enabled);
    setFormData((prev) => ({
      ...prev,
      lessons: {
        withModules: enabled,
        lessons: enabled ? [] : prev.lessons?.lessons || [],
        modules: enabled ? prev.lessons?.modules || [] : [],
      },
    }));
  };

  if (loading && !formData.title) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold">Edit Course</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <CourseBasicInfo formData={formData} onChange={handleChange} />

            {/* <div className="border-t pt-6">
              <OrderBumpForm
                orderBumps={formData.orderBump || []}
                onChange={(orderBumps) => setFormData(prev => ({ ...prev, orderBump: orderBumps }))}
              />
            </div> */}

            <div className="border-t pt-6">
              <CourseStructureToggle withModules={withModules} onToggle={toggleModules} />

              {!withModules ? (
                <SimpleLessonList
                  lessons={formData.lessons?.lessons || []}
                  onAddLesson={addLesson}
                  onUpdateLesson={updateLesson}
                  onRemoveLesson={removeLesson}
                  onAddDownload={() => {}}
                  onUpdateDownload={() => {}}
                  onRemoveDownload={() => {}}
                />
              ) : (
                <ModuleList
                  modules={formData.lessons?.modules || []}
                  onAddModule={addModule}
                  onUpdateModule={updateModule}
                  onRemoveModule={removeModule}
                  onAddLesson={addLessonToModule}
                  onUpdateLesson={updateModuleLesson}
                  onRemoveLesson={removeModuleLesson}
                  onAddLessonDownload={() => {}}
                  onUpdateLessonDownload={() => {}}
                  onRemoveLessonDownload={() => {}}
                />
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}