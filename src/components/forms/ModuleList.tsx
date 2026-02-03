import React from 'react';
import { Plus } from 'lucide-react';
import type { ModuleInput, LessonItemInput } from '../../types/course';
import { ModuleForm } from './ModuleForm';

interface ModuleListProps {
  modules: ModuleInput[];
  onAddModule: () => void;
  onUpdateModule: (moduleIndex: number, data: Partial<ModuleInput>) => void;
  onRemoveModule: (moduleIndex: number) => void;
  onAddLesson: (moduleIndex: number) => void;
  onUpdateLesson: (
    moduleIndex: number,
    lessonIndex: number,
    data: Partial<LessonItemInput>
  ) => void;
  onRemoveLesson: (moduleIndex: number, lessonIndex: number) => void;
  onAddLessonDownload: (moduleIndex: number, lessonIndex: number) => void;
  onUpdateLessonDownload: (
    moduleIndex: number,
    lessonIndex: number,
    downloadIndex: number,
    data: Partial<LessonItemInput>
  ) => void;
  onRemoveLessonDownload: (
    moduleIndex: number,
    lessonIndex: number,
    downloadIndex: number
  ) => void;
}

export function ModuleList({
  modules,
  onAddModule,
  onUpdateModule,
  onRemoveModule,
  onAddLesson,
  onUpdateLesson,
  onRemoveLesson,
  onAddLessonDownload,
  onUpdateLessonDownload,
  onRemoveLessonDownload,
}: ModuleListProps) {
  const handleUpdateDownload = (
    moduleIndex: number,
    lessonIndex: number,
    downloadIndex: number,
    data: Partial<LessonItemDownload>
  ) => {
    const updatedModules = [...modules];
    const targetLesson = updatedModules[moduleIndex].lessons[lessonIndex];
    const updatedDownloads = [...(targetLesson.downloads || [])];
  
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
  
    updatedModules[moduleIndex].lessons[lessonIndex].downloads = updatedDownloads;
  
    onUpdateModule(moduleIndex, { lessons: updatedModules[moduleIndex].lessons });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Modules</h3>
        <button
          type="button"
          onClick={onAddModule}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Module</span>
        </button>
      </div>
      {modules.map((module, moduleIndex) => (
        <ModuleForm
          key={moduleIndex}
          moduleIndex={moduleIndex}
          module={module}
          onUpdate={(data) => onUpdateModule(moduleIndex, data)}
          onRemove={() => onRemoveModule(moduleIndex)}
          onAddLesson={() => onAddLesson(moduleIndex)}
          onUpdateLesson={(lessonIndex, data) =>
            onUpdateLesson(moduleIndex, lessonIndex, data)
          }
          onRemoveLesson={(lessonIndex) => onRemoveLesson(moduleIndex, lessonIndex)}
          onAddLessonDownload={(lessonIndex) =>
            onAddLessonDownload(moduleIndex, lessonIndex)
          }
          onUpdateLessonDownload={(lessonIndex, downloadIndex, data) =>
            handleUpdateDownload(moduleIndex, lessonIndex, downloadIndex, data)
          }
          onRemoveLessonDownload={(lessonIndex, downloadIndex) =>
            onRemoveLessonDownload(moduleIndex, lessonIndex, downloadIndex)
          }
        />
      ))}
    </div>
  );
}
