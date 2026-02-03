import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

export function CartButton() {
  const { state } = useCart();
  const { language } = useLanguage();

  return (
    <Link
      to={`/${language}/cart`}
      className="relative p-2 text-white hover:text-gray-300 transition-colors"
    >
      <ShoppingCart className="w-6 h-6" />
      {state.items.length > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
          {state.items.length}
        </span>
      )}
    </Link>
  );
}