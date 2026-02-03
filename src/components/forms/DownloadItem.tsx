import { FileDown, Trash2 } from 'lucide-react';
import type { LessonItemDownload } from '../../types/course';

interface DownloadItemProps {
  download: LessonItemDownload;
  onUpdate: (data: Partial<LessonItemDownload>, index?: number) => void;
  onRemove: () => void;
}

export function DownloadItem({ download, onUpdate, onRemove }: DownloadItemProps) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 space-y-2 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <FileDown className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Download Title"
            value={download.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="flex-1 text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <input
          type="url"
          placeholder="File URL"
          value={download.file}
          onChange={(e) => onUpdate({ file: e.target.value })}
          className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="url"
          placeholder="Link"
          value={download.referenceLink}
          onChange={(e) => onUpdate({ referenceLink: e.target.value })}
          className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Size (e.g., 2.5MB)"
            value={download.size}
            onChange={(e) => onUpdate({ size: e.target.value })}
            className="flex-1 text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Extension"
            value={download.ext}
            onChange={(e) => onUpdate({ ext: e.target.value })}
            className="w-24 text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}