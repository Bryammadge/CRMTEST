import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../lib/supabase';
import { Phone, TrendingUp, Users, DollarSign, Clock, CheckCircle } from 'lucide-react';
import type { DailySummary, AgentPerformance, Call, Sale } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [performance, setPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      const [summaryData, callsData, salesData] = await Promise.all([
        apiRequest('/reports/daily-summary'),
        apiRequest('/calls'),
        apiRequest('/sales'),
      ]);

      setSummary(summaryData.summary);
      setRecentCalls(callsData.calls.slice(0, 5));
      setRecentSales(salesData.sales.slice(0, 5));

      // Only fetch agent performance for supervisors/admins
      if (profile?.role !== 'agent') {
        const perfData = await apiRequest('/reports/agent-performance');
        setPerformance(perfData.performance);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-900">Dashboard - {profile?.role?.toUpperCase()}</h2>
        <p className="text-gray-600">Bienvenido, {profile?.full_name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Llamadas Hoy</p>
              <p className="text-3xl text-gray-900 mt-1">{summary?.total_calls || 0}</p>
              <p className="text-sm text-green-600 mt-1">
                {summary?.completed_calls || 0} completadas
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Hoy</p>
              <p className="text-3xl text-gray-900 mt-1">{summary?.total_sales || 0}</p>
              <p className="text-sm text-yellow-600 mt-1">
                {summary?.pending_sales || 0} pendientes
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Validadas</p>
              <p className="text-3xl text-gray-900 mt-1">{summary?.validated_sales || 0}</p>
              <p className="text-sm text-green-600 mt-1">Confirmadas</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Hoy</p>
              <p className="text-3xl text-gray-900 mt-1">
                {new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                }).format(summary?.total_revenue || 0)}
              </p>
              <p className="text-sm text-blue-600 mt-1">Primas totales</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts - Only for Admin/Supervisor */}
      {profile?.role !== 'agent' && performance.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg text-gray-900 mb-4">Rendimiento por Agente</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="full_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_calls" fill="#3b82f6" name="Llamadas" />
                <Bar dataKey="total_sales" fill="#10b981" name="Ventas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg text-gray-900 mb-4">Comisiones por Agente</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="full_name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_commission" fill="#f59e0b" name="Comisiones (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg text-gray-900 mb-4">Últimas Llamadas</h3>
          <div className="space-y-3">
            {recentCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-900">{call.phone_number}</p>
                    <p className="text-xs text-gray-500">
                      {call.agent?.full_name} - {call.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(call.started_at).toLocaleTimeString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
            {recentCalls.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay llamadas recientes</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg text-gray-900 mb-4">Últimas Ventas</h3>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-green-600" />
                  <div>
                    <p className="text-sm text-gray-900">
                      {sale.lead?.first_name} {sale.lead?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sale.product?.name} - {sale.agent?.full_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(sale.premium_amount)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sale.status === 'validated' ? 'bg-green-100 text-green-800' :
                    sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay ventas recientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Agent Performance Table - Supervisor/Admin only */}
      {profile?.role !== 'agent' && performance.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg text-gray-900 mb-4">Tabla de Rendimiento</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Agente</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Llamadas</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Completadas</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Ventas</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Comisiones</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Conversión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {performance.map((agent) => (
                  <tr key={agent.agent_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{agent.full_name}</td>
                    <td className="px-6 py-4 text-gray-900">{agent.total_calls}</td>
                    <td className="px-6 py-4 text-gray-900">{agent.completed_calls}</td>
                    <td className="px-6 py-4 text-gray-900">{agent.total_sales}</td>
                    <td className="px-6 py-4 text-gray-900">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(agent.total_commission)}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {agent.total_calls > 0
                        ? `${((agent.total_sales / agent.total_calls) * 100).toFixed(1)}%`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
