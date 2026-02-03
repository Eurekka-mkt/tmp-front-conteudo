import { GripVertical, Trash2 } from 'lucide-react';
import type { LessonItemInput } from '../../types/course';
import { DownloadsList } from './DownloadsList';

interface LessonFormProps {
  index: number;
  lesson: LessonItemInput;
  onUpdate: (data: Partial<LessonItemInput>) => void;
  onRemove: () => void;
  onAddDownload: () => void;
  onUpdateDownload: (downloadIndex: number, data: Partial<LessonItemInput>) => void;
  onRemoveDownload: (downloadIndex: number) => void;
}

export function LessonForm({
  index,
  lesson,
  onUpdate,
  onRemove,
  onUpdateDownload,
  onRemoveDownload,
}: LessonFormProps) {
  
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Lesson {index + 1}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <input
        type="text"
        placeholder="Lesson Title"
        value={lesson.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <input
        type="url"
        placeholder="Video URL"
        value={lesson.video}
        onChange={(e) => onUpdate({ video: e.target.value })}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <textarea
        placeholder="Lesson Description"
        value={lesson.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        rows={3}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <DownloadsList
        downloads={lesson.downloads || []}
        onUpdate={onUpdateDownload}
        onRemove={onRemoveDownload}
        courseId={lesson.courseId}
        withModules={lesson.withModules}
        lessonIndex={index}
      />  
    </div>
  );
}