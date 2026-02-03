import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Truck, CheckCircle, Clock, Eye } from 'lucide-react';
import type { Order, PaginatedOrders } from '../../types/order';
import { useApi } from '../../hooks/useApi';
import { OrderDetailsModal } from './OrderDetailsModal';

const LIST_ORDERS_QUERY = `
  query ListOrders($access: Access, $offset: Int, $limit: Int, $search: String, $paid: Boolean, $sended: Boolean, $hasPhysicalItem: Boolean) {
    listOrders(access: $access, offset: $offset, limit: $limit, search: $search, paid: $paid, sended: $sended, hasPhysicalItem: $hasPhysicalItem) {
      data {
        address
        bookIds
        books {
          id
          title
          physical
          cover
          price
          code
        }
        courseIds
        courses {
          id
          title
          price
          currency
        }
        comboIds
        combos {
          id
          title
          price
          currency
          cover
          bookIds
          books {
            id
            title
            physical
          }
        }
        createdAt
        email
        phone
        hasPhysicalItem
        id
        name
        cpf
        paid
        paidAt
        sended
        sendedAt
        source
        updatedAt
      }
      pageInfo {
        currentPage
        hasNextPage
        hasPreviousPage
        totalPages
      }
    }
  }
`;

const UPDATE_ORDER_MUTATION = `
  mutation EditOrder($editOrderId: ID!, $data: UpdateOrderInput!) {
    editOrder(id: $editOrderId, data: $data)
  }
`;

export function OrderList() {
  const { query } = useApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [paidFilter, setPaidFilter] = useState<boolean | undefined>(undefined);
  const [sendedFilter, setSendedFilter] = useState<boolean | undefined>(undefined);
  const [physicalFilter, setPhysicalFilter] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  const fetchOrders = async (
    page: number = 1,
    search: string = '',
    paid: boolean | undefined = paidFilter,
    sended: boolean | undefined = sendedFilter,
    hasPhysicalItem: boolean | undefined = physicalFilter
  ) => {
    try {
      setLoading(true);
      const offset = (page - 1) * 10;
      const variables: any = {
        access: 'ADMIN',
        offset,
        limit: 10,
        search,
      };
      if (typeof paid !== 'undefined') variables.paid = paid;
      if (typeof sended !== 'undefined') variables.sended = sended;
      if (typeof hasPhysicalItem !== 'undefined') variables.hasPhysicalItem = hasPhysicalItem;
      const response = await query(LIST_ORDERS_QUERY, variables);
      setOrders(response.listOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, sended: boolean) => {
    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId));
      await query(UPDATE_ORDER_MUTATION, {
        editOrderId: orderId,
        data: { sended }
      });
      
      // Refresh the orders list
      fetchOrders(orders?.pageInfo.currentPage || 1, searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchOrders(1, searchTerm, paidFilter, sendedFilter, physicalFilter);
  }, [searchTerm, paidFilter, sendedFilter, physicalFilter]);

  const handlePageChange = (page: number) => {
    fetchOrders(page, searchTerm, paidFilter, sendedFilter, physicalFilter);
  };

  const formatDate = (dateString: string | boolean) => {
    if (typeof dateString === 'boolean' || !dateString) return '-';
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

  const getTotalItems = (order: Order) => {
    return (order.books?.length || 0) + (order.courses?.length || 0);
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Pedidos</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pagos</label>
              <select
                className="border rounded-lg px-2 py-1"
                value={paidFilter === undefined ? '' : paidFilter ? 'true' : 'false'}
                onChange={e => {
                  const val = e.target.value;
                  setPaidFilter(val === '' ? undefined : val === 'true');
                }}
              >
                <option value="">Todos</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Enviados</label>
              <select
                className="border rounded-lg px-2 py-1"
                value={sendedFilter === undefined ? '' : sendedFilter ? 'true' : 'false'}
                onChange={e => {
                  const val = e.target.value;
                  setSendedFilter(val === '' ? undefined : val === 'true');
                }}
              >
                <option value="">Todos</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Possui itens físicos</label>
              <select
                className="border rounded-lg px-2 py-1"
                value={physicalFilter === undefined ? '' : physicalFilter ? 'true' : 'false'}
                onChange={e => {
                  const val = e.target.value;
                  setPhysicalFilter(val === '' ? undefined : val === 'true');
                }}
              >
                <option value="">Todos</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Buscar por email ou ID do pedido..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Cliente</th>
                      <th className="text-left py-3 px-4">Data</th>
                      <th className="text-left py-3 px-4">Itens</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders?.data.map((order) => {
                      const status = getOrderStatus(order);
                      const StatusIcon = status.icon;
                      const isUpdating = updatingOrders.has(order.id);
                      
                      return (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-mono text-sm">
                              {order.id.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{order.email}</p>
                              {order.source && (
                                <p className="text-sm text-gray-500">Origem: {order.source}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <p>{formatDate(order.createdAt)}</p>
                              {order.paidAt && (
                                <p className="text-gray-500">Pago: {formatDate(order.paidAt)}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{getTotalItems(order)}</span>
                              {order.hasPhysicalItem && (
                                <Package className="w-4 h-4 text-orange-500" title="Contém itens físicos" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {order.hasPhysicalItem && order.paid && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, !order.sended)}
                                  disabled={isUpdating}
                                  className={`p-2 rounded-lg ${
                                    order.sended
                                      ? 'text-orange-600 hover:bg-orange-50'
                                      : 'text-green-600 hover:bg-green-50'
                                  } disabled:opacity-50`}
                                  title={order.sended ? 'Marcar como não enviado' : 'Marcar como enviado'}
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : order.sended ? (
                                    <Package className="w-4 h-4" />
                                  ) : (
                                    <Truck className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {orders && orders.data.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum pedido encontrado</p>
                </div>
              )}

              {orders && orders.data.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {orders.data.length} pedidos
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(orders.pageInfo.currentPage - 1)}
                      disabled={!orders.pageInfo.hasPreviousPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      title="Página anterior"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm">
                      Página {orders.pageInfo.currentPage} de {orders.pageInfo.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(orders.pageInfo.currentPage + 1)}
                      disabled={!orders.pageInfo.hasNextPage}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      title="Próxima página"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          isUpdating={updatingOrders.has(selectedOrder.id)}
        />
      )}
    </div>
  );
}