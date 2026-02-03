import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCoverFormatted } from './BookList';
import { PostCheckoutLS } from './PostCheckout';
import { PayPalPayment } from '../../components/PayPalPayment';
// import { useStoreTracking } from '../../hooks/useStoreTracking';
import { validateCPF, formatCPF, cleanCPF } from '../../utils/cpfValidator';
import { useApi } from '../../hooks/useApi';
import { Course } from '../../types/course';
import { Book } from '../../types/content';

const PUBLIC_GET_ORDER_BUMP_COURSE = `
  query PublicGetCourse($id: ID!) {
    publicGetCourse(id: $id) {
      id
      title
      description
      thumbnailUrl
      price
      currency
    }
  }
`;

const PUBLIC_GET_ORDER_BUMP_BOOK = `
  query PublicGetBook($id: ID!) {
    publicGetBook(id: $id) {
      id
      title
      description
      price
      cover
      physical
    }
  }
`;

type FormData = {
  name: string;
  email: string;
  cpf: string;
  countryCode: string;
  phone: string;
  zipCode: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  coupon: string;
};

type OrderBumpRaw = { type: 'COURSE' | 'BOOK' | 'CI' | 'MED'; data: any };

// ID do livro que deve ser exibido em parcelas
const SPECIAL_BOOK_ID = '6893adebaca3d330d0299179';
const INSTALLMENTS = 12;
const INSTALLMENT_VALUE = 59.90;

// Função para formatar o preço com lógica especial para livro específico
const formatPriceDisplay = (id: string, type: string, price: number, currency: string) => {
  if (id === SPECIAL_BOOK_ID && type === 'book') {
    return `${INSTALLMENTS} x R$${INSTALLMENT_VALUE.toFixed(2).replace('.', ',')}`;
  }
  return price.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: currency || 'BRL' 
  });
};

// Função para verificar se há apenas o livro especial no carrinho
const hasOnlySpecialBook = (items: CheckoutItem[]): boolean => {
  return items.length === 1 && items[0].id === SPECIAL_BOOK_ID && items[0].type === 'book';
};

// Função para formatar valor total quando é apenas o livro especial
const formatTotalForSpecialBook = (value: number): string => {
  return `${INSTALLMENTS} x R$${INSTALLMENT_VALUE.toFixed(2).replace('.', ',')}`;
};

type CheckoutItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  type: 'course' | 'book' | 'combo';
  quantity: number;
  thumbnailUrl?: string;
  cover?: string;
  physical?: boolean;
  shippingPrice?: number;
  orderBump?: OrderBumpRaw[];
  books?: Book[];
  courses?: Course[];
  cis?: { locale: string; value: number }[];
  meds?: { value: number }[];
};

export type CheckoutResponse =
  | { _id: string; text: string; image: string; expiration: string }
  | { _id: string; url: string };

export function Checkout() {
  const navigate = useNavigate();
  const { query } = useApi();
  const { state, clearCart, updateQuantity } = useCart();
  const { t, language } = useLanguage();
  // const { track } = useStoreTracking();
  const [searchParams] = useSearchParams();
  
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderBumpProducts, setOrderBumpProducts] = useState<any[]>([]);
  const [selectedOrderBumps, setSelectedOrderBumps] = useState<Set<string>>(new Set());
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    cpf: '',
    countryCode: '+55',
    phone: '',
    zipCode: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    coupon: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<
    'pix' | 'credit' | 'paypal'
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- helpers de validação ---
  const digits = (s: string) => (s || '').replace(/\D/g, '');
  const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const cpfOk = (c: string) => digits(c).length === 11; // (se quiser, aplique validação real de CPF)
  const ufOk = (uf: string) => /^[A-Za-z]{2}$/.test(uf.trim());

  // single sale
  const type = searchParams.get('type') as 'course' | 'book' | 'combo' | null;
  const id = searchParams.get('id');
  const isSingleSale = !!(type && id);

  // produto único
  const singleProductQuery = useQuery({
    queryKey: ['single-product', type, id],
    queryFn: async () => {
      if (!type || !id) return null;
      const endpoint = `https://v2-ms-content-${
        import.meta.env.VITE_V2_URL_ID
      }-uc.a.run.app/graphql`;
      let query = '';
      if (type === 'course') {
        query = `query PublicGetCourse($id: ID!) {
          publicGetCourse(id: $id) {
            id title price currency thumbnailUrl orderBump { type data }
          }
        }`;
      } else if (type === 'book') {
        query = `query PublicGetBook($id: ID!) {
          publicGetBook(id: $id) {
            id title price currency cover physical shippingPrice orderBump { type data }
          }
        }`;
      } else if (type === 'combo') {
        query = `query PublicGetCombo($id: ID!) {
          publicGetCombo(id: $id) {
            id title price currency cover singleSale books { id title physical cover } courses { id title thumbnailUrl } cis { locale value } meds { value } orderBump { type data }
          }
        }`;
      }
      const response = await axios.post(endpoint, { query, variables: { id } });
      const data = response.data.data;
      if (!data) return null;
      if (type === 'course') return data.publicGetCourse;
      if (type === 'book') return data.publicGetBook;
      if (type === 'combo') return data.publicGetCombo;
      return null;
    },
    enabled: isSingleSale,
  });

  // itens do checkout
  const checkoutItems: CheckoutItem[] = useMemo(() => {
    if (isSingleSale && singleProductQuery.data) {
      const p = singleProductQuery.data;
      return [
        {
          id: p.id,
          title: p.title,
          price: p.price || 0,
          currency: p.currency || 'BRL',
          type: type!,
          quantity: 1,
          thumbnailUrl: p.thumbnailUrl,
          cover: p.cover,
          physical: p.physical,
          shippingPrice: p.shippingPrice,
          orderBump: p.orderBump,
          books: 'books' in p ? p.books : [],
          courses: 'courses' in p ? p.courses : [],
          cis: 'cis' in p ? p.cis : [],
          meds: 'meds' in p ? p.meds : [],
        },
      ];
    }
    return state.items.map((item) => ({
      id: item.course.id,
      title: item.course.title,
      price: item.course.price || 0,
      currency:
        ('currency' in item.course ? item.course.currency : 'BRL') || 'BRL',
      type: ('physical' in item.course ? 'book' : 'courseIds' in item.course ? 'combo' : 'course') as
        | 'course'
        | 'book'
        | 'combo',
      quantity: item.quantity,
      thumbnailUrl:
        'thumbnailUrl' in item.course ? item.course.thumbnailUrl : undefined,
      cover: 'cover' in item.course ? item.course.cover : undefined,
      physical: 'physical' in item.course ? item.course.physical : false,
      shippingPrice:
        'shippingPrice' in item.course ? item.course.shippingPrice : undefined,
      orderBump:
        'orderBump' in item.course
          ? (item.course.orderBump as OrderBumpRaw[])
          : undefined,
      books: 'books' in item.course ? item.course.books : [],
      courses: 'courses' in item.course ? item.course.courses : [],
      cis: 'cis' in item.course ? item.course.cis : [],
      meds: 'meds' in item.course ? item.course.meds : [],
    }));
  }, [isSingleSale, singleProductQuery.data, state.items, type]);

  // Buscar produtos de order bump para todos os itens do checkout
  useEffect(() => {
    if (hasInitialized || !checkoutItems.length) return;

    const fetchOrderBumpProducts = async () => {
      let allOrderBumps = [];
      for (const item of checkoutItems) {
        const orderBumps = item.orderBump;
        if (!orderBumps) continue;
        for (const bump of orderBumps) {
          try {
            let product = null;

            const tryParseData = (data: any) => {
              if (typeof data === 'string') {
                try {
                  return JSON.parse(data);
                } catch {
                  return data;
                }
              }
              return data;
            };

            const parsedData = tryParseData(bump.data);
            if (bump.type === 'COURSE') {
              // Se parsedData for objeto com id/_id, use direto; se for string, busque
              if (typeof parsedData === 'object' && (parsedData.id || parsedData._id)) {
                product = { ...parsedData, type: 'COURSE' };
              } else {
                const response = await query<{ publicGetCourse: Course }>(
                  PUBLIC_GET_ORDER_BUMP_COURSE,
                  { id: parsedData },
                  false
                );
                product = { ...response.publicGetCourse, type: 'COURSE' };
              }
            } else if (bump.type === 'BOOK') {
              if (typeof parsedData === 'object' && (parsedData.id || parsedData._id)) {
                product = { ...parsedData, type: 'BOOK' };
              } else {
                const response = await query<{ publicGetBook: Book }>(
                  PUBLIC_GET_ORDER_BUMP_BOOK,
                  { id: parsedData },
                  false
                );
                product = { ...response.publicGetBook, type: 'BOOK' };
              }
            } else if (bump.type === 'CI') {
              product = {
                id: `ci-${Date.now()}`,
                title: `Conversa Inicial (${parsedData.locale})`,
                description: `Conversa Inicial no valor de ${parsedData.value} ${parsedData.locale === 'BR' ? 'BRL' : 'USD'}`,
                price: parsedData.value,
                type: 'CI',
                locale: parsedData.locale,
                physical: false
              };
            } else if (bump.type === 'MED') {
              product = {
                id: `med-${Date.now()}`,
                title: 'Consulta Médica',
                description: `Consulta Médica no valor de ${parsedData.value} BRL`,
                price: parsedData.value,
                type: 'MED',
                physical: false
              };
            }
            if (product) {
              allOrderBumps.push(product);
            }
          } catch (error) {
            console.error('Error fetching order bump product:', error);
          }
        }
      }
      setHasInitialized(true);
      setOrderBumpProducts(allOrderBumps);
    };
    fetchOrderBumpProducts();
  }, [checkoutItems]);

  const hasPhysicalBooks = checkoutItems.some((i) => i.physical) || orderBumpProducts.some(p => selectedOrderBumps.has(p.id) && p.type === 'BOOK' && p.physical) || singleProductQuery.data?.books?.some((b: Book) => b.physical);

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (cleanCep.length !== 8) {
      return;
    }

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (response.data.erro) {
        return;
      }

      const { logradouro, bairro, localidade, uf } = response.data;
      setFormData(prev => ({
        ...prev,
        address: logradouro || prev.address,
        neighborhood: bairro || prev.neighborhood,
        city: localidade || prev.city,
        state: uf || prev.state,
      }));
    } catch (error) {
      console.error("Error fetching CEP:", error);
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedCPF = formatCPF(value);
    
    setFormData(prev => ({ ...prev, cpf: formattedCPF }));
    
    // Validar CPF apenas se tiver 11 dígitos
    const cleanedCPF = cleanCPF(value);
    if (cleanedCPF.length === 11) {
      if (validateCPF(cleanedCPF)) {
        setCpfError(null);
      } else {
        setCpfError('CPF inválido');
      }
    } else if (cleanedCPF.length > 0) {
      setCpfError('CPF deve ter 11 dígitos');
    } else {
      setCpfError(null);
    }
  };

  // ---- validação do formulário para habilitar o token ----
  const identityOk =
    formData.name.trim().length >= 3 &&
    emailOk(formData.email) &&
    cpfOk(formData.cpf);

  const addressOk =
    !hasPhysicalBooks ||
    (digits(formData.zipCode).length === 8 &&
      formData.address.trim() &&
      formData.number.trim() &&
      formData.neighborhood.trim() &&
      formData.city.trim() &&
      ufOk(formData.state));

  const isFormReady = identityOk && addressOk;

  // ====== Cupom (verificação real em V2 Voucher) ======
  const cupomMutation = useMutation({
    mutationFn: async () => {
      const code = formData.coupon.trim();
      if (!code) throw new Error('no_code');

      const url = `https://v2-ms-voucher-${
        import.meta.env.VITE_V2_URL_ID
      }-uc.a.run.app/cupons/${encodeURIComponent(code)}/verify`;

      const { data } = await axios.get<{
        _id: string;
        discount: {
          amount: number;
          currency: string;
          type: 'PERCENTAGE' | 'VALUE';
        };
        paymentMethodsAllowed: ('CHECKOUT' | 'PIX')[];
        flows: ('CI' | 'MED' | 'CONTENT')[];
      }>(url, {
        params: {
          flow: 'CONTENT',
          ...(formData.email ? { ref: formData.email } : {}),
        },
      });

      return data;
    },
  });

  // ====== FORMATADORES E TOTAIS POR MOEDA (para o RESUMO) ======
  const formatMoney = (v: number, c: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: c }).format(
      v
    );

  // moedas presentes (inclui order bump selecionados)
  const bumpSelectedProducts = orderBumpProducts.filter(p => selectedOrderBumps.has(p.id));
  const allProducts = [...checkoutItems, ...bumpSelectedProducts];
  const currencies = Array.from(
    new Set(allProducts.map((i) => i.currency || 'BRL'))
  );
  const singleCurrency = currencies.length === 1;
  const cartCurrency = singleCurrency ? currencies[0] : undefined;

  // subtotais por moeda (inclui order bump selecionados)
  const subtotalByCurrency = allProducts.reduce<Record<string, number>>(
    (acc, i) => {
      const c = i.currency || 'BRL';
      acc[c] = (acc[c] ?? 0) + i.price * (i.quantity || 1);
      return acc;
    },
    {}
  );

  // frete por moeda (só livros físicos, inclui order bump selecionados)
  const shippingByCurrency = allProducts.reduce<Record<string, number>>(
    (acc, i) => {
      if (i.physical) {
        const c = i.currency || 'BRL';
        acc[c] = (acc[c] ?? 0) + (i.shippingPrice || 0) * (i.quantity || 1);
      }
      return acc;
    },
    {}
  );

  // base por moeda
  const baseByCurrency = Object.fromEntries(
    currencies.map((c) => [
      c,
      (subtotalByCurrency[c] ?? 0) + (shippingByCurrency[c] ?? 0),
    ])
  );

  // desconto por moeda (aqui só para exibição do resumo)
  const discountByCurrency: Record<string, number> = useMemo(() => {
    const out: Record<string, number> = {};
    const d = cupomMutation.data?.discount;
    if (!d) return out;

    if (d.type === 'PERCENTAGE') {
      const pct = d.amount / 10000; // ex.: 1500 = 15,00%
      currencies.forEach((c) => (out[c] = (baseByCurrency[c] ?? 0) * pct));
    } else {
      // VALUE: aplica na moeda do cupom (ou na única moeda do carrinho)
      const c = d.currency || cartCurrency || 'BRL';
      out[c] = (out[c] ?? 0) + d.amount / 100;
    }
    return out;
  }, [cupomMutation.data, currencies.join('|'), cartCurrency, baseByCurrency]);

  // total final por moeda
  const totalByCurrency = Object.fromEntries(
    currencies.map((c) => [
      c,
      Math.max(0, (baseByCurrency[c] ?? 0) - (discountByCurrency[c] ?? 0)),
    ])
  );

  // ====== (cálculos antigos seguem para integração com backend/pagamento) ======
  // Soma CI/MED selecionados
  const ciMedSelected = orderBumpProducts.filter(
    p => selectedOrderBumps.has(p.id) && (p.type === 'CI' || p.type === 'MED')
  );
  const ciMedTotal = ciMedSelected.reduce((sum, item) => sum + (item.price || 0), 0);

  const subtotal = allProducts.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  ) + ciMedTotal;
  const shippingCost = allProducts
    .filter((item) => item.physical)
    .reduce((acc, item) => acc + (item.shippingPrice || 0) * (item.quantity || 1), 0);
  const totalBase = subtotal + shippingCost;

  const discountValue = useMemo(() => {
    const d = cupomMutation.data?.discount;
    if (!d) return 0;
    if (d.type === 'PERCENTAGE') return totalBase * (d.amount / 10000);
    return d.amount / 100;
  }, [cupomMutation.data, totalBase]);

  const price = Math.max(0, totalBase - discountValue); // usado em labels/botão; resumo usa totalByCurrency

  // --- token do checkout: NÃO cria automático (enabled: false) ---
  const tokenQuery = useQuery({
    queryKey: [
      'checkout-token',
      checkoutItems,
      cupomMutation.data?._id,
      selectedOrderBumps,
      isFormReady,
      currencies,
    ],
    queryFn: async () => {
      const utmSource = localStorage.getItem('eurekka_utm_source');
      // Separar order bumps por tipo
      const ciOrderBump = orderBumpProducts.find(p => 
        selectedOrderBumps.has(p.id) && p.type === 'CI'
      );
      const medOrderBump = orderBumpProducts.find(p => 
        selectedOrderBumps.has(p.id) && p.type === 'MED'
      );

      // Filtrar apenas itens regulares (COURSE e BOOK) para o array items
      const regularItems = Array.from(selectedOrderBumps)
        .map(productId => {
          const product = orderBumpProducts.find(p => p.id === productId);
          return product && (product.type === 'COURSE' || product.type === 'BOOK') 
            ? { id: productId, quantity: 1 }
            : undefined;
        })
        .filter((item): item is { id: string; quantity: number } => !!item);

      const payload: any = {
        items: [
          ...checkoutItems.map((i) => ({ id: i.id, quantity: i.quantity })),
          ...regularItems,
        ],
        ...(ciOrderBump ? { ci: { locale: ciOrderBump.locale, value: ciOrderBump.price } } : {}),
        ...(medOrderBump ? { med: { value: medOrderBump.price } } : {}),
        cupomId: cupomMutation.data?._id,
        ...(utmSource ? { source: utmSource } : {}),
        name: formData.name,
        email: formData.email,
        cpf: digits(formData.cpf),
        phone: digits(`${formData.countryCode}${formData.phone}`),
        currency: cartCurrency ?? currencies[0] ?? 'BRL',
        ...(hasPhysicalBooks
          ? {
              address: {
                street: formData.address,
                number: formData.number,
                complement: formData.complement,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                country: 'BRA',
                zip: digits(formData.zipCode),
              },
            }
          : {}),
      };

      const url = `https://v2-ms-content-${
        import.meta.env.VITE_V2_URL_ID
      }-uc.a.run.app/create-checkout-token`;
      const response = await axios.post(url, payload);
      return response.data as {
        token: string;
        currency: string;
        value: number;
      };
    },
    enabled: false,
    refetchOnWindowFocus: false,
  });

  // Submit PIX/Credit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar CPF antes do submit
    const cleanedCPF = cleanCPF(formData.cpf);
    if (!validateCPF(cleanedCPF)) {
      setCpfError('CPF inválido');
      return;
    }
    
    if (paymentMethod === 'paypal') return;
    const token = (await tokenQuery.refetch()).data?.token;
    if (!token) return;

    setIsSubmitting(true);
    try {
      const submitData: any = {
        token: token,
        email: formData.email,
        name: formData.name,
        cpf: digits(formData.cpf),
        cupomId: cupomMutation.data?._id,
      };

      if (hasPhysicalBooks) {
        submitData.address = {
          street: formData.address,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          country: 'BRA',
          zip: digits(formData.zipCode),
        };
      }

      const endpoint =
        paymentMethod === 'pix'
          ? `https://us-central1-${
              import.meta.env.VITE_V1_URL_ID
            }.cloudfunctions.net/checkout/pix/content`
          : `https://us-central1-${
              import.meta.env.VITE_V1_URL_ID
            }.cloudfunctions.net/checkout/redirect/content`;

      const response = await axios.post<CheckoutResponse>(endpoint, submitData);
      PostCheckoutLS.set(response.data);
      setIsLoading(true);

      if (!isSingleSale) clearCart();
      localStorage.removeItem('eurekka_utm_source');
      if ("url" in response.data) {
      window.location.assign(response.data?.url);
      } else {
        navigate(`/${language}/postcheckout`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // PayPal
  const handlePayPalSuccess = (result: any) => {
    PostCheckoutLS.set(result);
    if (!isSingleSale) clearCart();
    localStorage.removeItem('eurekka_utm_source');
    navigate(`/${language}/postcheckout`);
  };
  const handlePayPalError = (err: any) => {
    console.error('PayPal error:', err);
    alert(t('checkout.errorPayment') || 'Erro no pagamento');
  };

  const handleOrderBumpToggle = (productId: string) => {
    setSelectedOrderBumps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (isLoading || (isSingleSale && singleProductQuery.isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 font-bold mb-4">Redirecionando...</p>
          <Loader2 className="animate-spin h-12 w-12 text-yellow-600 mx-auto mb-4" />
        </div>
      </div>
    );
  }

  // Loading produto único
  if (isSingleSale && singleProductQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // vazio
  if (!isSingleSale && checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-black border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                to={`/${language}/courses`}
                className="flex items-center space-x-2 text-white hover:text-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('checkout.back')}</span>
              </Link>
              <img
                src="https://eurekka-wordpress.s3.amazonaws.com/wp-content/uploads/2020/09/15222523/logo-eurekka-1.png"
                width={120}
                alt=""
              />
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t('checkout.empty')}</h2>
            <Link
              to={`/${language}/courses`}
              className="inline-flex items-center space-x-2 text-yellow-600 hover:text-yellow-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('checkout.backToCourses')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={
                isSingleSale
                  ? `/${language}/${type === 'combo' ? 'combos' : `${type}s`}/${id}`
                  : `/${language}/cart`
              }
              className="flex items-center space-x-2 text-white hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('checkout.back')}</span>
            </Link>
            <img
              src="https://eurekka-wordpress.s3.amazonaws.com/wp-content/uploads/2020/09/15222523/logo-eurekka-1.png"
              width={120}
              alt=""
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-6">
              {t('checkout.title')}
            </h2>

            <div className="space-y-4">
              {checkoutItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-start gap-x-4 p-4 border rounded-lg"
                >
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.thumbnailUrl || item.cover ? (
                      <img
                        src={
                          item.thumbnailUrl || getCoverFormatted(item.cover!)
                        }
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        {t('common.noImage')}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2">{item.title}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                        <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.type === 'course'
                          ? 'bg-blue-100 text-blue-800'
                          : item.type === 'combo'
                          ? 'bg-purple-100 text-purple-800'
                          : item.physical
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                        }`}
                        >
                        {item.type === 'course'
                          ? t('tag.courseDigital')
                          : item.type === 'combo'
                          ? t('tag.combo')
                          : item.physical
                          ? t('tag.physicalBook')
                          : t('tag.ebook')}
                        </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-yellow-600">
                        {formatPriceDisplay(item.id, item.type, item.price, item.currency || 'BRL')}
                      </span>
                      {!isSingleSale && item.physical && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {(item.cis?.length || item.cis?.length || item.cis?.length || item.meds?.length) && (
                    <div className="w-full flex flex-col gap-2 mt-4">
                      <p className="mb-2">{t('checkout.includes')}</p>

                      {item.books?.map((book) => (
                        <div key={book.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className='w-12 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                            {book.cover ? (
                              <img
                                src={getCoverFormatted(book.cover)}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-center text-gray-400 text-xs">
                                {t('common.noImage')}
                              </div>
                            )}
                          </div>
                          {book.title} {book.physical ? `(${t('tag.physicalBook')})` : `(${t('tag.ebook')})`}
                        </div>
                      ))}
                      {item.courses?.map((course) => (
                        <div key={course.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className='w-12 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0'>
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-center text-gray-400 text-xs">
                                {t('common.noImage')}
                              </div>
                            )}
                          </div>
                          {course.title} ({t('tag.courseDigital')})
                        </div>
                      ))}
                      {item.cis?.map((ci, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className='min-w-12 w-12 h-10 flex justify-center items-center rounded-lg bg-gray-100 text-gray-400 font-bold'>
                            <p>CI</p>
                          </div>
                          {t('checkout.initialConversation')} ({formatMoney(ci.value, ci.locale === 'BR' ? 'BRL' : 'USD')})
                        </div>
                      ))}
                      {item.meds?.map((med, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className='min-w-12 w-12 h-10 flex justify-center items-center rounded-lg bg-gray-100 text-gray-400 font-bold'>
                            <p>MED</p>
                          </div>
                          {t('checkout.medicConsultation')} ({formatMoney(med.value, 'BRL')})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Order Bump Section */}
            {orderBumpProducts.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h2 className="text-lg font-medium mb-4">Veja também:</h2>
                <div className="space-y-4">
                  {orderBumpProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedOrderBumps.has(product.id)
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          id={`order-bump-${product.id}`}
                          checked={selectedOrderBumps.has(product.id)}
                          onChange={() => handleOrderBumpToggle(product.id)}
                          className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {((product.type === 'COURSE' && product.thumbnailUrl) || 
                                (product.type === 'BOOK' && product.cover)) ? (
                                <img
                                  src={
                                    product.type === 'COURSE' 
                                      ? product.thumbnailUrl 
                                      : getCoverFormatted(product.cover)
                                  }
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <span className="text-gray-400 text-xs text-center">
                                    {product.type === 'CI' ? 'CI' : product.type === 'MED' ? 'MED' : 'No Image'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <label
                                htmlFor={`order-bump-${product.id}`}
                                className="cursor-pointer"
                              >
                                <h3 className="font-medium text-lg text-gray-900">
                                  {product.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                  {product.description}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    product.type === 'BOOK' && product.physical
                                      ? 'bg-orange-100 text-orange-800'
                                      : product.type === 'CI'
                                        ? 'bg-purple-100 text-purple-800'
                                        : product.type === 'MED'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-green-100 text-green-800'
                                  }`}>
                                    {product.type === 'COURSE' 
                                      ? 'Curso Digital'
                                      : product.type === 'CI'
                                        ? `Terapia`
                                        : product.type === 'MED'
                                          ? 'Consulta Psiquiátrica'
                                          : product.physical 
                                            ? 'Livro Físico' 
                                            : 'E-book Digital'
                                    }
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <span className="text-lg font-bold text-yellow-600">
                                    {formatPriceDisplay(product.id, product.type === 'BOOK' ? 'book' : product.type.toLowerCase(), product.price || 0, product.currency ?? "BRL")}
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cupom */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder={t('checkout.coupon.placeholder')}
                  value={formData.coupon}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, coupon: e.target.value }))
                  }
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <button
                  type="button"
                  onClick={() => cupomMutation.mutate()}
                  disabled={cupomMutation.isPending || !formData.coupon.trim()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cupomMutation.isPending
                    ? t('checkout.coupon.verifying')
                    : t('checkout.coupon.verify')}
                </button>
              </div>
              {cupomMutation.isError && (
                <p className="text-red-600 text-sm mt-2">
                  {t('checkout.coupon.invalid')}
                </p>
              )}
              {cupomMutation.data && (
                <p className="text-green-600 text-sm mt-2">
                  {t('checkout.coupon.applied')}
                </p>
              )}
            </div>

            {/* Totais (com moeda correta) */}
            <div className="mt-6 pt-6 border-t space-y-2">
              {singleCurrency ? (
                <>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {hasOnlySpecialBook(checkoutItems) 
                        ? formatTotalForSpecialBook(subtotalByCurrency[cartCurrency!] ?? 0)
                        : formatMoney(
                            subtotalByCurrency[cartCurrency!] ?? 0,
                            cartCurrency!
                          )
                      }
                    </span>
                  </div>

                  {(shippingByCurrency[cartCurrency!] ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span>
                        {formatMoney(
                          shippingByCurrency[cartCurrency!] ?? 0,
                          cartCurrency!
                        )}
                      </span>
                    </div>
                  )}

                  {(discountByCurrency[cartCurrency!] ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>
                        -
                        {formatMoney(
                          discountByCurrency[cartCurrency!] ?? 0,
                          cartCurrency!
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-yellow-600">
                      {hasOnlySpecialBook(checkoutItems)
                        ? formatTotalForSpecialBook(totalByCurrency[cartCurrency!] ?? 0)
                        : formatMoney(
                            totalByCurrency[cartCurrency!] ?? 0,
                            cartCurrency!
                          )
                      }
                    </span>
                  </div>
                </>
              ) : (
                // múltiplas moedas: exibir por moeda
                <>
                  {currencies.map((c) => (
                    <div key={c} className="mb-3">
                      <div className="flex justify-between">
                        <span>Subtotal ({c}):</span>
                        <span>
                          {hasOnlySpecialBook(checkoutItems)
                            ? formatTotalForSpecialBook(subtotalByCurrency[c] ?? 0)
                            : formatMoney(subtotalByCurrency[c] ?? 0, c)
                          }
                        </span>
                      </div>
                      {(shippingByCurrency[c] ?? 0) > 0 && (
                        <div className="flex justify-between">
                          <span>Frete ({c}):</span>
                          <span>
                            {formatMoney(shippingByCurrency[c] ?? 0, c)}
                          </span>
                        </div>
                      )}
                      {(discountByCurrency[c] ?? 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto ({c}):</span>
                          <span>
                            -{formatMoney(discountByCurrency[c] ?? 0, c)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total ({c}):</span>
                        <span className="text-yellow-600">
                          {hasOnlySpecialBook(checkoutItems)
                            ? formatTotalForSpecialBook(totalByCurrency[c] ?? 0)
                            : formatMoney(totalByCurrency[c] ?? 0, c)
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados pessoais */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t('checkout.personalInfo')}
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder={t('checkout.name')}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <input
                    type="email"
                    required
                    placeholder={t('checkout.email')}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('checkout.cpf')}
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    maxLength={14}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                      cpfError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {cpfError && (
                    <p className="mt-1 text-sm text-red-600">{cpfError}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      required
                      placeholder="DDI"
                      value={formData.countryCode}
                      onChange={(e) => setFormData((p) => ({ ...p, countryCode: e.target.value }))}
                      className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    <input
                      type="tel"
                      required
                      placeholder={t('checkout.phone')}
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço (somente livros físicos) */}
              {hasPhysicalBooks && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {t('checkout.address.title')}
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      required
                      placeholder="CEP"
                      value={formData.zipCode}
                      onChange={(e) => {
                        const clean = digits(e.target.value).slice(0, 8);
                        const formatted = clean.replace(
                          /(\d{5})(\d{0,3})/,
                          (_, a, b) => (b ? `${a}-${b}` : a)
                        );
                        setFormData((p) => ({ ...p, zipCode: formatted }));

                        if (clean.length === 8) {
                          fetchAddressByCep(clean);
                        }
                      }}
                      maxLength={9}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        className="col-span-2 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder={t('checkout.address.street')}
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                        required
                      />
                      <input
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder={t('checkout.address.number')}
                        value={formData.number}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, number: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <input
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder={t('checkout.address.complement')}
                      value={formData.complement}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          complement: e.target.value,
                        }))
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder={t('checkout.address.neighborhood')}
                        value={formData.neighborhood}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            neighborhood: e.target.value,
                          }))
                        }
                        required
                      />
                      <input
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder={t('checkout.address.city')}
                        value={formData.city}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, city: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <input
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Estado (UF)"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, state: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
              )}

              {/* Pagamento */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t('checkout.payment.title')}
                </h3>
                <div className="space-y-3">
                  {language === 'br' ? (
                    <>
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pix"
                          checked={paymentMethod === 'pix'}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as any)
                          }
                          className="mr-3"
                        />
                        <Smartphone className="w-5 h-5 mr-3 text-green-600" />
                        <div>
                          <div className="font-medium">
                            {t('checkout.payment.pix')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('checkout.payment.pix.helper')}
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credit"
                          checked={paymentMethod === 'credit'}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as any)
                          }
                          className="mr-3"
                        />
                        <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
                        <div>
                          <div className="font-medium">
                            {t('checkout.payment.credit')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {t('checkout.payment.credit.helper')}
                          </div>
                        </div>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => {
                            if (
                              !!formData.email.trim() &&
                              !!formData.cpf.trim()
                            ) {
                              tokenQuery.refetch(); // refetch token when switching to PayPal
                              setPaymentMethod(e.target.value as any);
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="w-5 h-5 mr-3 flex items-center justify-center">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-5 h-5 text-blue-600"
                          >
                            <path
                              fill="currentColor"
                              d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.421c-.315-.178-.7-.284-1.148-.284H12.22l-.901 5.718h2.188c2.57 0 4.578-.543 5.69-1.81.842-.96 1.304-2.42 1.012-4.287-.023-.143-.047-.288-.077-.437z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">PayPal</div>
                          <div className="text-sm text-gray-500">
                            Pagamento internacional
                          </div>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* PayPal - só renderiza quando o token existir */}
              {paymentMethod === 'paypal' && tokenQuery.data && (
                <div className="border-t pt-6">
                  <PayPalPayment
                    token={tokenQuery.data.token}
                    value={Math.round(price * 100)}
                    currency={tokenQuery.data.currency}
                    email={formData.email}
                    voucherId={cupomMutation.data?._id}
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                  />
                </div>
              )}

              {/* Submit (PIX/Cartão) */}
              {paymentMethod !== 'paypal' && (
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormReady || !paymentMethod}
                  className="w-full bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting
                    ? t('checkout.redirecting')
                    : `${t('checkout.pay')} ${hasOnlySpecialBook(checkoutItems)
                        ? formatTotalForSpecialBook(totalByCurrency[cartCurrency!] ?? 0)
                        : formatMoney(
                            totalByCurrency[cartCurrency!] ?? 0,
                            cartCurrency!
                          )
                      }`}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}