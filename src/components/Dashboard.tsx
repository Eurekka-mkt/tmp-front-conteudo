import React from 'react';
import { BookOpen, FileText, Image, BookMarked, TrendingUp, Users, Clock } from 'lucide-react';

const stats = [
  { 
    label: 'Total de Cursos', 
    value: '24', 
    icon: BookOpen, 
    trend: '+12%', 
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500'
  },
  { 
    label: 'Total de Posts', 
    value: '156', 
    icon: FileText, 
    trend: '+8%', 
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500'
  },
  { 
    label: 'Banners Ativos', 
    value: '12', 
    icon: Image, 
    trend: '+2%', 
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500'
  },
  { 
    label: 'Livros Publicados', 
    value: '48', 
    icon: BookMarked, 
    trend: '+15%', 
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500'
  },
];

const recentActivity = [
  { type: 'course', title: 'React Masterclass', action: 'publicado', time: '2h atrás' },
  { type: 'post', title: 'Começando com TypeScript', action: 'atualizado', time: '4h atrás' },
  { type: 'banner', title: 'Banner Promoção de Verão', action: 'criado', time: '6h atrás' },
  { type: 'book', title: 'Padrões JavaScript', action: 'publicado', time: '8h atrás' },
];

export function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Visão Geral</h1>
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 hidden sm:inline">Última atualização: Agora</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-xl lg:text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-500">{stat.trend}</span>
              <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Atividade Recente</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">Ver tudo</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-50">
                    {activity.type === 'course' && <BookOpen className="w-5 h-5 text-blue-500" />}
                    {activity.type === 'post' && <FileText className="w-5 h-5 text-green-500" />}
                    {activity.type === 'banner' && <Image className="w-5 h-5 text-purple-500" />}
                    {activity.type === 'book' && <BookMarked className="w-5 h-5 text-orange-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Usuários Ativos</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-500">423 online agora</span>
            </div>
          </div>
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Gráfico de atividade em breve</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}