import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CreateCourseInput, LessonItemInput, ModuleInput, LessonItemDownload, Currency, Language } from '../../types/course';
import { useApi } from '../../hooks/useApi';
import { CourseBasicInfo } from '../forms/CourseBasicInfo';
import { CourseStructureToggle } from '../forms/CourseStructureToggle';
import { SimpleLessonList } from '../forms/SimpleLessonList';
import { ModuleList } from '../forms/ModuleList';

const CREATE_COURSE_MUTATION = `
  mutation CreateCourse($data: CreateCourseInput!) {
    createCourse(data: $data)
  }
`;

export function CourseForm() {
  const navigate = useNavigate();
  const { query } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withModules, setWithModules] = useState(false);
  const [formData, setFormData] = useState<CreateCourseInput>({
    title: '',
    slug: '',
    description: '',
    published: false,
    thumbnailUrl: '',
    price: 0,
    currency: Currency.BRL,
    language: Language.PT_BR,
    singleSale: false,
    lessons: {
      withModules: false,
      lessons: [],
      modules: [],
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await query(CREATE_COURSE_MUTATION, { data: formData });
      navigate('/admin/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
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

  const updateLesson = (index: number, lessonData: Partial<LessonItemInput>) => {
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

  const updateModule = (moduleIndex: number, moduleData: Partial<ModuleInput>) => {
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
    lessonData: Partial<LessonItemInput>
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

  const addDownloadToLesson = (lessonIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        lessons: prev.lessons!.lessons!.map((lesson, i) =>
          i === lessonIndex
            ? {
                ...lesson,
                downloads: [...(lesson.downloads || []), { title: '', file: '', input: '', size: '', ext: '' }],
              }
            : lesson
        ),
      },
    }));
  };

  const updateLessonDownload = (
    lessonIndex: number,
    downloadIndex: number,
    downloadData: Partial<LessonItemDownload>
  ) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        lessons: prev.lessons!.lessons!.map((lesson, i) =>
          i === lessonIndex
            ? {
                ...lesson,
                downloads: lesson.downloads!.map((download, j) =>
                  j === downloadIndex ? { ...download, ...downloadData } : download
                ),
              }
            : lesson
        ),
      },
    }));
  };

  const removeLessonDownload = (lessonIndex: number, downloadIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        lessons: prev.lessons!.lessons!.map((lesson, i) =>
          i === lessonIndex
            ? {
                ...lesson,
                downloads: lesson.downloads!.filter((_, j) => j !== downloadIndex),
              }
            : lesson
        ),
      },
    }));
  };

  const addDownloadToModuleLesson = (moduleIndex: number, lessonIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons!,
        modules: prev.lessons!.modules!.map((module, i) =>
          i === moduleIndex
            ? {
                ...module,
                lessons: module.lessons!.map((lesson, j) =>
                  j === lessonIndex
                    ? {
                        ...lesson,
                        downloads: [...(lesson.downloads || []), { title: '', file: '', size: '', ext: '' }],
                      }
                    : lesson
                ),
              }
            : module
        ),
      },
    }));
  };

  const updateModuleLessonDownload = (
    moduleIndex: number,
    lessonIndex: number,
    downloadIndex: number,
    downloadData: Partial<LessonItemDownload>
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
                  j === lessonIndex
                    ? {
                        ...lesson,
                        downloads: lesson.downloads!.map((download, k) =>
                          k === downloadIndex ? { ...download, ...downloadData } : download
                        ),
                      }
                    : lesson
                ),
              }
            : module
        ),
      },
    }));
  };

  const removeModuleLessonDownload = (
    moduleIndex: number,
    lessonIndex: number,
    downloadIndex: number
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
                  j === lessonIndex
                    ? {
                        ...lesson,
                        downloads: lesson.downloads!.filter((_, k) => k !== downloadIndex),
                      }
                    : lesson
                ),
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/courses')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-semibold">Create New Course</h2>
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
              onAddDownload={addDownloadToLesson}
              onUpdateDownload={updateLessonDownload}
              onRemoveDownload={removeLessonDownload}
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
              onAddLessonDownload={addDownloadToModuleLesson}
              onUpdateLessonDownload={updateModuleLessonDownload}
              onRemoveLessonDownload={removeModuleLessonDownload}
            />
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}