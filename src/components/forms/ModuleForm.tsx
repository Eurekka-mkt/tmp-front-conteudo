import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { ModuleInput, LessonItemInput } from '../../types/course';
import { LessonForm } from './LessonForm';

interface ModuleFormProps {
  moduleIndex: number;
  module: ModuleInput;
  onUpdate: (data: Partial<ModuleInput>) => void;
  onRemove: () => void;
  onAddLesson: () => void;
  onUpdateLesson: (lessonIndex: number, data: Partial<LessonItemInput>) => void;
  onRemoveLesson: (lessonIndex: number) => void;
  onAddLessonDownload: (lessonIndex: number) => void;
  onUpdateLessonDownload: (
    lessonIndex: number,
    downloadIndex: number,
    data: Partial<LessonItemInput>
  ) => void;
  onRemoveLessonDownload: (lessonIndex: number, downloadIndex: number) => void;
}

export function ModuleForm({
  moduleIndex,
  module,
  onUpdate,
  onRemove,
  onAddLesson,
  onUpdateLesson,
  onRemoveLesson,
  onAddLessonDownload,
  onUpdateLessonDownload,
  onRemoveLessonDownload,
}: ModuleFormProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Module {moduleIndex + 1}</span>
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
        placeholder="Module Title"
        value={module.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="pl-6 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700">Module Lessons</h4>
          <button
            type="button"
            onClick={onAddLesson}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lesson</span>
          </button>
        </div>
        {module.lessons?.map((lesson: LessonItemInput, lessonIndex: number) => (
          <LessonForm
            key={lessonIndex}
            index={lessonIndex}
            lesson={lesson}
            onUpdate={(data) => onUpdateLesson(lessonIndex, data)}
            onRemove={() => onRemoveLesson(lessonIndex)}
            onAddDownload={() => onAddLessonDownload(lessonIndex)}
            onUpdateDownload={(downloadIndex, data) =>
              onUpdateLessonDownload(lessonIndex, downloadIndex, data)
            }
            onRemoveDownload={(downloadIndex) =>
              onRemoveLessonDownload(lessonIndex, downloadIndex)
            }
          />
        ))}
      </div>
    </div>
  );
}
