import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/supabase';
import type { Call } from '../../types';
import { Phone, PhoneIncoming, PhoneOutgoing } from 'lucide-react';

export default function CallsView() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalls();
  }, []);

  async function fetchCalls() {
    try {
      setLoading(true);
      const data = await apiRequest('/calls');
      setCalls(data.calls);
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds?: number): string {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      ringing: 'bg-blue-100 text-blue-800',
      answered: 'bg-green-100 text-green-800',
      completed: 'bg-green-200 text-green-900',
      no_answer: 'bg-yellow-100 text-yellow-800',
      busy: 'bg-orange-100 text-orange-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl text-gray-900">Historial de Llamadas</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Llamadas</p>
              <p className="text-3xl text-gray-900 mt-1">{totalCalls}</p>
            </div>
            <Phone className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="text-3xl text-gray-900 mt-1">{completedCalls}</p>
            </div>
            <Phone className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa Éxito</p>
              <p className="text-3xl text-gray-900 mt-1">
                {totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0}%
              </p>
            </div>
            <Phone className="text-purple-600" size={32} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Duración Media</p>
              <p className="text-2xl text-gray-900 mt-1">{formatDuration(avgDuration)}</p>
            </div>
            <Phone className="text-orange-600" size={32} />
          </div>
        </div>
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
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Número</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Lead</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Agente</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Estado</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Duración</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Fecha/Hora</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {call.direction === 'outbound' ? (
                        <PhoneOutgoing className="text-blue-600" size={20} />
                      ) : (
                        <PhoneIncoming className="text-green-600" size={20} />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {call.phone_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {call.lead ? (
                        <div>
                          <p>{call.lead.first_name} {call.lead.last_name}</p>
                          <p className="text-xs text-gray-500">{call.lead.phone}</p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {call.agent?.full_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>
                        <p>{new Date(call.started_at).toLocaleDateString('es-ES')}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(call.started_at).toLocaleTimeString('es-ES')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {call.notes || call.outcome || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {calls.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay llamadas registradas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
