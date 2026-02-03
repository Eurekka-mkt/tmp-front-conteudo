import { Plus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { LessonItemDownload } from '../../types/course';
import { DownloadItem } from './DownloadItem';
import { EDIT_COURSE_MUTATION } from '../course/CourseEditForm';
import { fetchGraphQL } from '../../lib/api';

interface DownloadsListProps {
  downloads: LessonItemDownload[];
  onUpdate: (index: number, data: Partial<LessonItemDownload>) => void;
  onRemove: (index: number) => void;
  courseId: string;
  withModules: boolean;
  moduleIndex?: number;
  lessonIndex: number;
  modules?: any[];
  lessons?: any[];
}

export function DownloadsList({
  downloads,
  onUpdate,
  onRemove,
  courseId,
  withModules,
  moduleIndex,
  lessonIndex,
  modules = [],
  lessons = [],
}: DownloadsListProps) {

  const editCourse = useMutation({
    mutationFn: async ({ courseId, data }: { courseId: string; data: any }) => {
      if (!courseId) throw new Error('courseId is required');
      return fetchGraphQL(EDIT_COURSE_MUTATION, { editCourseId: courseId, data });
    },
    
    onSuccess: () => {
      console.log('Curso atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar curso:', error);
    },
  });

  const generateMutationPayload = (newDownloads: LessonItemDownload[]) => {
    if (withModules) {
      const updatedModules = modules.map((mod, i) => {
        if (i !== moduleIndex) return mod;

        return {
          ...mod,
          lessons: mod.lessons.map((lesson, j) => {
            if (j !== lessonIndex) return lesson;

            return {
              ...lesson,
              downloads: newDownloads,
            };
          }),
        };
      });

      return {
        editCourseId: courseId,
        data: {
          lessons: {
            withModules: true,
            modules: updatedModules,
            lessons,
          },
        },
      };
    } else {
      const updatedLessons = lessons.map((lesson, i) => {
        if (i !== lessonIndex) return lesson;

        return {
          ...lesson,
          downloads: newDownloads,
        };
      });

      return {
        editCourseId: courseId,
        data: {
          lessons: {
            withModules: false,
            modules,
            lessons: updatedLessons,
          },
        },
      };
    }
  };

  const handleUpdate = (index: number, data: Partial<LessonItemDownload>) => {
    const newDownloads = downloads.map((item, i) =>
      i === index ? { ...item, ...data } : item
    );

    onUpdate(index, data);

    const { data: updatedData } = generateMutationPayload(newDownloads);

    editCourse.mutate({ courseId, data: updatedData });
  };

  const handleAddClick = () => {
    const newDownload: LessonItemDownload = {
      title: '',
      file: '',
      referenceLink: '',
      size: '',
      ext: '',
    };

    const newDownloads = [...downloads, newDownload];

    onUpdate(newDownloads.length - 1, newDownload);

    const { editCourseId, data: updatedData } = generateMutationPayload(newDownloads);

    editCourse.mutate({ courseId, data: updatedData });
  };

  const handleRemove = (index: number) => {};

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Downloads</h4>
        <button
          type="button"
          onClick={handleAddClick}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Download</span>
        </button>
      </div>
      {downloads.map((download, index) => (
        <DownloadItem
          key={index}
          download={download}
          onUpdate={(data) => handleUpdate(index, data)}
          onRemove={() => handleRemove(index)}
        />
      ))}
    </div>
  );
}