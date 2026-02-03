import { useState } from 'react';
import { Smartphone, Image as ImageIcon, MousePointer } from 'lucide-react';
import { AppContentList } from './AppContentList';
import type { AppTypeEnum } from '../../types/appContent';

const tabs = [
  { id: 'POP_UP' as AppTypeEnum, label: 'Pop-up', icon: Smartphone },
  { id: 'BANNER' as AppTypeEnum, label: 'Banner', icon: ImageIcon },
  { id: 'BUTTON' as AppTypeEnum, label: 'Botão', icon: MousePointer },
];

export function AppContentManagement() {
  const [activeTab, setActiveTab] = useState<AppTypeEnum>('POP_UP');

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Conteúdo do App</h2>

          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AppContentList type={activeTab} />
        </div>
      </div>
    </div>
  );
}
