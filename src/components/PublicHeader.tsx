import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { CartButton } from './CartButton';

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold">Eurekka</span>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/courses"
                className={`transition-colors ${
                  isActive('/courses')
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cursos
              </Link>
              <Link
                to="/books"
                className={`transition-colors ${
                  isActive('/books')
                    ? 'text-yellow-500 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                E-books
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <CartButton />
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50">
          <nav className="px-4 py-2">
            <Link
              to="/courses"
              onClick={() => setIsMenuOpen(false)}
              className={`block py-3 ${
                isActive('/courses')
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600'
              }`}
            >
              Cursos
            </Link>
            <Link
              to="/books"
              onClick={() => setIsMenuOpen(false)}
              className={`block py-3 ${
                isActive('/books')
                  ? 'text-yellow-500 font-medium'
                  : 'text-gray-600'
              }`}
            >
              E-books
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}