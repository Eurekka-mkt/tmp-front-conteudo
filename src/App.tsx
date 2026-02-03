import { useEffect, useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  Outlet,
} from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Menu } from 'lucide-react';

import { LoginPage } from './components/auth/LoginPage';
import { UnauthorizedPage } from './components/UnauthorizedPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CourseList } from './components/course/CourseList';
import { CourseForm } from './components/course/CourseForm';
import { CourseEditForm } from './components/course/CourseEditForm';
import { BookList } from './components/books/BookList';
import { BookForm } from './components/books/BookForm';
import { EditBookForm } from './components/books/EditBookForm';
import { BannerList } from './components/banners/BannerList';
import { CreateBannerForm } from './components/banners/CreateBannerForm';
import { BannerForm } from './components/banners/BannerForm';
import { NewsList } from './components/news/NewsList';
import { NewsForm } from './components/news/NewsForm';
import { NewsEditForm } from './components/news/NewsEditForm';
import { BlogPostList } from './components/blog/BlogPostList';
import { OrderList } from './components/orders/OrderList';

import { ComboList } from './components/combos/ComboList';
import { ComboForm } from './components/combos/ComboForm';
import { EditComboForm } from './components/combos/EditComboForm';
import { PublicCourseList } from './pages/public/CourseList';
import { PublicCourseDetails } from './pages/public/CourseDetails';
import { PublicBookList } from './pages/public/BookList';
import { PublicBookDetails } from './pages/public/BookDetails';
import { PublicComboList } from './pages/public/ComboList';
import { PublicComboDetails } from './pages/public/ComboDetails';
import { Checkout } from './pages/public/Checkout';
import { Cart } from './pages/public/Cart';
import { PostCheckout } from './pages/public/PostCheckout';
import { CoursePermissions } from './components/course/CoursePermission';

import { LanguageProvider } from './contexts/LanguageContext';
import { InvoiceDataList } from './components/invoice/InvoiceDataList';
import { AccountManagement } from './pages/AccountManagement';

function App() {
  // Persistência global do utm_source
  const UTM_KEY = 'eurekka_utm_source';
  const ORIGIN_URL_KEY = 'eurekka_origin_url';
  const PRIMARY_SOURCE_KEY = 'eurekka_primary_source';
  const PRIMARY_ORIGIN_URL_KEY = 'eurekka_primary_origin_url';

  const persistUtmSource = () => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = hash.substring(queryIndex + 1);
      const params = new URLSearchParams(queryString);
      const utm = params.get('utm_source');
      if (utm) {
        localStorage.setItem(UTM_KEY, utm);
        
        // Salvar como primary source apenas se não existir
        if (!localStorage.getItem(PRIMARY_SOURCE_KEY)) {
          localStorage.setItem(PRIMARY_SOURCE_KEY, utm);
        }
        
        return '?' + params.toString();
      }
    }
    return '';
  };

  const persistOriginData = () => {
    const referrer = document.referrer;
    
    // Salvar URL de origem atual
    if (referrer && !referrer.includes(window.location.hostname)) {
      localStorage.setItem(ORIGIN_URL_KEY, referrer);
      
      // Salvar como primary origin apenas se não existir
      if (!localStorage.getItem(PRIMARY_ORIGIN_URL_KEY)) {
        localStorage.setItem(PRIMARY_ORIGIN_URL_KEY, referrer);
      }
    }
  };
  useEffect(() => {
    persistUtmSource();
    persistOriginData();
  }, []);

  // crie uma função para recuperar os parâmetros da url
  const getParamsFromUrl = () => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = hash.substring(queryIndex + 1);
      return "?" + (new URLSearchParams(queryString).toString());
    }
    return "?" + (new URLSearchParams().toString());
  };

  const { isLoading, isAuthenticated, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  // Helpers para rotas legadas com :id
  function RedirectCourseId() {
    const { id } = useParams();
    return <Navigate to={`/br/courses/${id}`} replace />;
  }
  function RedirectBookId() {
    const { id } = useParams();
    return <Navigate to={`/br/books/${id}`} replace />;
  }
  function RedirectComboId() {
    const { id } = useParams();
    return <Navigate to={`/br/combos/${id}`} replace />;
  }

  // Shell da área admin (usa Outlet para filhos relativos)
  function AdminShell() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
      <div className="flex w-screen h-screen overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-lg bg-slate-900 text-white"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-40 lg:relative lg:translate-x-0 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 pt-16 lg:pt-0">
          <Outlet />
        </main>
      </div>
    );
  }

  // Wrapper das rotas públicas com provider de linguagem
  function PublicWrapper() {
    return (
      <LanguageProvider>
        <Outlet />
      </LanguageProvider>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ========= Admin ========= */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/admin"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <ProtectedRoute>
                <AdminShell />
              </ProtectedRoute>
            )
          }
        >
          {/* Filhos RELATIVOS ao /admin */}
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/permissions" element={<CoursePermissions />} />
          <Route path="courses/new" element={<CourseForm />} />
          <Route path="courses/edit/:id" element={<CourseEditForm />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="invoice-data" element={<InvoiceDataList />} />
          <Route path="books" element={<BookList />} />
          <Route path="books/new" element={<BookForm />} />
          <Route path="books/edit/:id" element={<EditBookForm />} />
          <Route path="combos" element={<ComboList />} />
          <Route path="combos/new" element={<ComboForm />} />
          <Route path="combos/edit/:id" element={<EditComboForm />} />
          <Route path="blog" element={<BlogPostList />} />
          <Route path="banners" element={<BannerList />} />
          <Route path="banners/new" element={<CreateBannerForm />} />
          <Route path="banners/edit/:id" element={<BannerForm />} />
          <Route path="posts" element={<NewsList />} />
          <Route path="posts/new" element={<NewsForm />} />
          <Route path="posts/edit/:id" element={<NewsEditForm />} />
          <Route path="contas" element={<AccountManagement/>} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>

        {/* ========= Público (com idioma) ========= */}
        <Route element={<PublicWrapper />}>
          {/* :lang = br|es (validação/redirect ocorre no LanguageProvider) */}
          <Route path=":lang/courses" element={<PublicCourseList />} />
          <Route path=":lang/courses/:id" element={<PublicCourseDetails />} />
          <Route path=":lang/books" element={<PublicBookList />} />
          <Route path=":lang/books/:id" element={<PublicBookDetails />} />
          <Route path=":lang/combos" element={<PublicComboList />} />
          <Route path=":lang/combos/:id" element={<PublicComboDetails />} />
          <Route path=":lang/cart" element={<Cart />} />
          <Route path=":lang/checkout" element={<Checkout />} />
          <Route path=":lang/postcheckout" element={<PostCheckout />} />
        </Route>

        <Route path="/courses" element={<Navigate to={`/br/courses${getParamsFromUrl()}`} replace />} />
        <Route path="/courses/:id" element={<RedirectCourseId />} />
        <Route path="/books" element={<Navigate to={`/br/books${getParamsFromUrl()}`} replace />} />
        <Route path="/books/:id" element={<RedirectBookId />} />
        <Route path="/combos" element={<Navigate to={`/br/combos${getParamsFromUrl()}`} replace />} />
        <Route path="/combos/:id" element={<RedirectComboId />} />
        <Route path="/cart" element={<Navigate to={`/br/cart${getParamsFromUrl()}`} replace />} />
        <Route path="/checkout" element={<Navigate to={`/br/checkout${getParamsFromUrl()}`} replace />} />
        <Route path="/postcheckout" element={<Navigate to={`/br/postcheckout${getParamsFromUrl()}`} replace />} />

        {/* ========= Root ========= */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/admin/courses" replace />
              : <Navigate to={`/br/courses${getParamsFromUrl()}`} replace />
          }
        />

        {/* ========= Catch-all ========= */}
        <Route path="*" element={<Navigate to="/br/courses" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
