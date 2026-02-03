import { X, Package, Truck, CheckCircle, Clock, MapPin, User, Mail, Calendar } from 'lucide-react';
import type { Order } from '../../types/order';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, sended: boolean) => void;
  isUpdating: boolean;
}

export function OrderDetailsModal({ order, onClose, onUpdateStatus, isUpdating }: OrderDetailsModalProps) {
  const formatDate = (dateString: string | boolean) => {
    if (typeof dateString === 'boolean') {
      return dateString ? 'Sim' : '-';
    }
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStatus = (order: Order) => {
    if (!order.paid) {
      return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    if (order.hasPhysicalItem && !order.sended) {
      return { label: 'Pago - Aguardando Envio', color: 'bg-blue-100 text-blue-800', icon: Package };
    }
    if (order.hasPhysicalItem && order.sended) {
      return { label: 'Enviado', color: 'bg-green-100 text-green-800', icon: Truck };
    }
    return { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getCoverFormatted = (cover: string) => {
    if (cover && cover.includes('drive.google')) {
      const coverId = cover.split('/')[cover.split('/').length - 2];
      return `https://drive.google.com/thumbnail?id=${coverId}&sz=w1000`;
    }
    return cover;
  };

  const status = getOrderStatus(order);
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Detalhes do Pedido</h2>
              <div className="flex items-center space-x-4">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  ID: {order.id}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {status.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informações do Cliente
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{order.email}</span>
                  </div>
                  {order.name && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{order.name}</span>
                    </div>
                  )}
                  {order.cpf && (
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2 text-gray-500">📄</span>
                      <span>CPF: {order.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
                    </div>
                  )}
                  {order.phone && (
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2 text-gray-500">📞</span>
                      <span>Tel: {order.phone}</span>
                    </div>
                  )}
                  {order.source && (
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2 text-gray-500">🔗</span>
                      <span>Origem: {order.source}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              {order.address && typeof order.address === 'object' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Endereço de Entrega
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>{order.address.street}, {order.address.number}</p>
                    {order.address.complement && <p>{order.address.complement}</p>}
                    <p>{order.address.neighborhood}</p>
                    <p>{order.address.city} - {order.address.state}</p>
                    <p>CEP: {order.address.zip}</p>
                  </div>
                </div>
              )}

              {/* Order Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Timeline do Pedido
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium">Pedido criado</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  
                  {order.paid && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium">Pagamento confirmado</p>
                        <p className="text-xs text-gray-500">{formatDate(order.paidAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.sended && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium">Pedido enviado</p>
                        <p className="text-xs text-gray-500">{formatDate(order.sendedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-6">
              {/* Books */}
              {order.books && order.books.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Livros ({order.books.length})</h3>
                  <div className="space-y-3">
                    {order.books.map((book) => (
                      <div key={book.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="w-16 h-20 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {book.cover ? (
                            <img
                              src={getCoverFormatted(book.cover)}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{book.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              book.physical 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {book.physical ? 'Físico' : 'Digital'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {order.courses && order.courses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Cursos ({order.courses.length})</h3>
                  <div className="space-y-3">
                    {order.courses.map((course) => (
                      <div key={course.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{course.title}</h4>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Curso Digital
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Combos */}
              {order.combos && order.combos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Combos ({order.combos.length})</h3>
                  <div className="space-y-3">
                    {order.combos.map((combo) => (
                      <div key={combo.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="w-16 h-20 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {combo.cover ? (
                            <img
                              src={getCoverFormatted(combo.cover)}
                              alt={combo.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{combo.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              combo.books.some((book) => book.physical)
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {combo.books.some((book) => book.physical) ? 'Contém Conteúdo Físico' : 'Apenas Conteúdo Digital'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {order.hasPhysicalItem && order.paid && (
                <div className="pt-4 border-t">
                  <button
                    onClick={() => onUpdateStatus(order.id, !order.sended)}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      order.sended
                        ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isUpdating ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : order.sended ? (
                      <>
                        <Package className="w-5 h-5" />
                        <span>Marcar como Não Enviado</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-5 h-5" />
                        <span>Marcar como Enviado</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}