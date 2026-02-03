import { Plus } from 'lucide-react';
import type { LessonItemInput } from '../../types/course';
import { LessonForm } from './LessonForm';

interface SimpleLessonListProps {
  lessons: LessonItemInput[];
  onAddLesson: () => void;
  onUpdateLesson: (index: number, data: Partial<LessonItemInput>) => void;
  onRemoveLesson: (index: number) => void;
  onAddDownload: (lessonIndex: number) => void;
  onUpdateDownload: (
    lessonIndex: number,
    downloadIndex: number,
    data: Partial<LessonItemInput>
  ) => void;
  onRemoveDownload: (lessonIndex: number, downloadIndex: number) => void;
}

export function SimpleLessonList({
  lessons,
  onAddLesson,
  onUpdateLesson,
  onRemoveLesson,
  onAddDownload,
  onUpdateDownload,
  onRemoveDownload,
}: SimpleLessonListProps) {
  const handleUpdateDownload = (
    lessonIndex: number,
    downloadIndex: number,
    data: Partial<LessonItemDownload>
  ) => {
    console.log('Dados recebidos:', { lessonIndex, downloadIndex, data });

    const updatedLessons = [...lessons];
    const lesson = updatedLessons[lessonIndex];

    const updatedDownloads = [...(lesson.downloads || [])];

    if (downloadIndex >= updatedDownloads.length) {
      updatedDownloads.push({
        title: '',
        file: '',
        referenceLink: '',
        size: '',
        ext: '',
        ...data,
      });
    } else {
      updatedDownloads[downloadIndex] = {
        ...updatedDownloads[downloadIndex],
        ...data,
      };
    }

    updatedLessons[lessonIndex] = {
      ...lesson,
      downloads: updatedDownloads,
    };

    onUpdateLesson(lessonIndex, updatedLessons[lessonIndex]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lessons</h3>
        <button
          type="button"
          onClick={onAddLesson}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lesson</span>
        </button>
      </div>
      {lessons.map((lesson, index) => (
        <LessonForm
          key={index}
          index={index}
          lesson={lesson}
          onUpdate={(data) => onUpdateLesson(index, data)}
          onRemove={() => onRemoveLesson(index)}
          onAddDownload={() => onAddDownload(index)}
          onUpdateDownload={(downloadIndex, data) =>
            handleUpdateDownload(index, downloadIndex, data)
          }
          onRemoveDownload={(downloadIndex) =>
            onRemoveDownload(index, downloadIndex)
          }
        />
      ))}
    </div>
  );
}
