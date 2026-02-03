import { useState } from 'react';
import { X, Mail, Phone, Gift, Globe } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getTrackingData, markNewsletterShown, markNewsletterSubscribed } from '../../utils/tracking';
import { useLanguage } from '../../contexts/LanguageContext';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CREATE_NEWSLETTER_MUTATION = `
  mutation CreateNewsletter($newsletter: NewsletterInput) {
    createNewsletter(newsletter: $newsletter)
  }
`;

export function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const { query } = useApi();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ddi, setDdi] = useState('+55');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const trackingData = getTrackingData();
      
      // Concatenar DDI + telefone e manter apenas números
      const fullPhone = phone.trim() ? (ddi + phone.trim()).replace(/\D/g, '') : undefined;
      
      await query(CREATE_NEWSLETTER_MUTATION, {
        newsletter: {
          browserId: trackingData.browserId,
          locale: language.toUpperCase(),
          email: email.trim(),
          phone: fullPhone,
          source: trackingData.source,
          primarySource: trackingData.primarySource,
          originUrl: trackingData.originUrl,
          primaryOriginUrl: trackingData.primaryOriginUrl,
        }
      }, false);

      // Marcar como inscrito e salvar dados
      markNewsletterSubscribed(email.trim(), fullPhone);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    markNewsletterShown();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-white/20 rounded-full">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Ofertas Exclusivas!</h2>
              <p className="text-yellow-100 text-sm">Não perca nossas promoções</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Receba ofertas especiais da Eurekka
            </h3>
            <p className="text-gray-600 text-sm">
              Cadastre-se e seja o primeiro a saber sobre descontos exclusivos, 
              novos cursos e conteúdos gratuitos.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone (opcional)
              </label>
              <div className="flex space-x-2">
                <div className="relative w-24">
                  <input
                    type="text"
                    value={ddi}
                    onChange={(e) => setDdi(e.target.value)}
                    className="w-full pl-8 pr-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-center"
                  />
                  <Globe className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                </div>
                <div className="relative flex-1">
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Exemplo: +55 (11) 99999-9999
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Agora não
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cadastrando...' : 'Quero as ofertas!'}
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Seus dados estão seguros. Não compartilhamos com terceiros.
          </p>
        </div>
      </div>
    </div>
  );
}