import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { BookOpen, LayoutDashboard, FileText, Image, BookMarked, ShoppingBag, LogOut, X, Rss, Package, Receipt, User, Smartphone } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Painel', href: '/admin' },
  { icon: BookOpen, label: 'Cursos', href: '/admin/courses' },
  { icon: Package, label: 'Combos', href: '/admin/combos' },
  { icon: ShoppingBag, label: 'Pedidos', href: '/admin/orders' },
  { icon: Receipt, label: 'Dados NF', href: '/admin/invoice-data' },
  { icon: FileText, label: 'Posts', href: '/admin/posts' },
  { icon: User, label: 'Contas', href: '/admin/contas'},
  { icon: Rss, label: 'Blog', href: '/admin/blog' },
  { icon: Image, label: 'Banners', href: '/admin/banners' },
  { icon: BookMarked, label: 'Livros', href: '/admin/books' },
  { icon: Smartphone, label: 'Conteúdo do App', href: '/admin/app-content' },
];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div className="bg-slate-900 text-white w-[280px] flex-shrink-0 flex flex-col h-full relative">
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-blue-400" />
            <span className="ml-2 text-xl font-bold">Eurekka</span>
          </div>
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <img
                src={user?.picture || "https://super.abril.com.br/wp-content/uploads/2018/07/566ee0ae82bee174ca0300dahomer-simpson.jpeg?crop=1&resize=1212,909"}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover"
              />
              <div>
                <h2 className="font-medium text-xs">{user?.email?.split('@')[0] || 'User'}</h2>
                {/* <p className="text-slate-400 text-xs">{user?.email}</p> */}
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href === '/courses' && location.pathname.startsWith('/courses'));
            
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
}