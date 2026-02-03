import React from 'react';

interface CourseStructureToggleProps {
  withModules: boolean;
  onToggle: (enabled: boolean) => void;
}

export function CourseStructureToggle({ withModules, onToggle }: CourseStructureToggleProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Course Structure
      </label>
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`px-4 py-2 rounded-lg ${
            !withModules
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Simple Lessons
        </button>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`px-4 py-2 rounded-lg ${
            withModules
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Modules with Lessons
        </button>
      </div>
    </div>
  );
}