import  { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {  Menu, X } from 'lucide-react';
import { CartButton } from '../CartButton';
import { useLanguage } from '../../contexts/LanguageContext';

export function SalesHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { language, t } = useLanguage();
  
  const isCoursesPage = location.pathname.includes('/courses');
  const isBooksPage = location.pathname.includes('/books');

  return (
    <header className="bg-black border-b border-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <img src="https://eurekka-wordpress.s3.amazonaws.com/wp-content/uploads/2020/09/15222523/logo-eurekka-1.png" width={120} alt="" />
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to={`/${language}/courses`}
                className={`transition-colors ${
                  isCoursesPage
                    ? 'text-yellow-600 font-medium'
                    : 'text-white hover:text-gray-300'
                }`}
              >
                {t('header.courses')}
              </Link>
              <Link
                to={`/${language}/books`}
                className={`transition-colors ${
                  isBooksPage
                    ? 'text-yellow-500 font-medium'
                    : 'text-white hover:text-gray-300'
                }`}
              >
                {t('header.books')}
              </Link>
              <Link
                to={`/${language}/combos`}
                className={`transition-colors ${
                  location.pathname.includes('/combos')
                    ? 'text-purple-500 font-medium'
                    : 'text-white hover:text-gray-300'
                }`}
              >
                Combos
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <CartButton />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white hover:text-gray-300 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black border-b border-gray-900 shadow-lg z-50">
          <nav className="px-4 py-2">
            <Link
              to={`/${language}/courses`}
              onClick={() => setIsMenuOpen(false)}
              className={`block py-3 ${
                isCoursesPage
                  ? 'text-yellow-600 font-medium'
                  : 'text-white'
              }`}
            >
              {t('header.courses')}
            </Link>
            <Link
              to={`/${language}/books`}
              onClick={() => setIsMenuOpen(false)}
              className={`block py-3 ${
                isBooksPage
                  ? 'text-yellow-500 font-medium'
                  : 'text-white'
              }`}
            >
              {t('header.books')}
            </Link>
            <Link
              to={`/${language}/combos`}
              onClick={() => setIsMenuOpen(false)}
              className={`block py-3 ${
                location.pathname.includes('/combos')
                  ? 'text-purple-500 font-medium'
                  : 'text-white'
              }`}
            >
              Combos
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}