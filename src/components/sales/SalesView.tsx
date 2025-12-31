import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Sale } from '../../types';
import { CheckCircle, XCircle, Eye, DollarSign } from 'lucide-react';

export default function SalesView() {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    try {
      setLoading(true);
      const data = await apiRequest('/sales');
      setSales(data.sales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateSale(saleId: string, status: 'validated' | 'rejected') {
    if (!confirm(`¿Está seguro de ${status === 'validated' ? 'validar' : 'rechazar'} esta venta?`)) {
      return;
    }

    try {
      await apiRequest(`/sales/${saleId}/validate`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      fetchSales();
    } catch (error) {
      console.error('Error validating sale:', error);
      alert('Error al validar la venta');
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      validated: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  const filteredSales = filter === 'all' 
    ? sales 
    : sales.filter(sale => sale.status === filter);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.premium_amount, 0);
  const totalCommissions = filteredSales.reduce((sum, sale) => sum + (sale.agent_commission || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-gray-900">Gestión de Ventas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-3xl text-gray-900 mt-1">{filteredSales.length}</p>
            </div>
            <DollarSign className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl text-gray-900 mt-1">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(totalRevenue)}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comisiones</p>
              <p className="text-2xl text-gray-900 mt-1">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(totalCommissions)}
              </p>
            </div>
            <DollarSign className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="validated">Validadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">ID Póliza</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Producto</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Agente</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Prima</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Comisión</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Estado</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.policy_number || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {sale.lead?.first_name} {sale.lead?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{sale.lead?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{sale.product?.name}</p>
                      <p className="text-xs text-gray-500">{sale.product?.type}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.agent?.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(sale.premium_amount)}
                      <p className="text-xs text-gray-500">{sale.payment_frequency}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(sale.agent_commission || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.sale_date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {profile?.role !== 'agent' && sale.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleValidateSale(sale.id, 'validated')}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                              title="Validar venta"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleValidateSale(sale.id, 'rejected')}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                              title="Rechazar venta"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay ventas para mostrar
            </div>
          )}
        </div>
      )}
    </div>
  );
}
