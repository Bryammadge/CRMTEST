import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/supabase';
import type { Lead } from '../../types';
import { Phone, Edit, Eye, Plus, Filter } from 'lucide-react';
import SoftPhone from '../sip/SoftPhone';
import LeadModal from './LeadModal';

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showPhoneFor, setShowPhoneFor] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const data = await apiRequest('/leads');
      setLeads(data.leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCallStart(leadId: string, phoneNumber: string, callId: string) {
    try {
      // Register call in database
      await apiRequest('/calls/start', {
        method: 'POST',
        body: JSON.stringify({
          lead_id: leadId,
          phone_number: phoneNumber,
          direction: 'outbound',
          sip_call_id: callId,
        }),
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }

  async function handleCallEnd(callId: string, duration: number) {
    try {
      // Find the call by sip_call_id and update it
      await apiRequest(`/calls/${callId}/end`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'completed',
          answered_at: new Date(Date.now() - duration * 1000).toISOString(),
        }),
      });
      
      setShowPhoneFor(null);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      nuevo: 'bg-blue-100 text-blue-800',
      contactado: 'bg-yellow-100 text-yellow-800',
      interesado: 'bg-green-100 text-green-800',
      no_interesado: 'bg-red-100 text-red-800',
      venta: 'bg-purple-100 text-purple-800',
      venta_validada: 'bg-green-200 text-green-900',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      baja: 'text-gray-500',
      normal: 'text-blue-500',
      alta: 'text-orange-500',
      urgente: 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  }

  const filteredLeads = filterStatus === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-gray-900">Gestión de Leads</h2>
        <button
          onClick={() => {
            setModalMode('create');
            setSelectedLead(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Lead
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <Filter size={20} className="text-gray-500" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="nuevo">Nuevo</option>
          <option value="contactado">Contactado</option>
          <option value="interesado">Interesado</option>
          <option value="no_interesado">No Interesado</option>
          <option value="venta">Venta</option>
          <option value="venta_validada">Venta Validada</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando leads...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Prioridad</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Estado</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Campaña</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Agente</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Último Contacto</th>
                  <th className="px-6 py-3 text-left text-xs uppercase text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`text-2xl ${getPriorityColor(lead.priority)}`}>
                        ●
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900">{lead.first_name} {lead.last_name}</p>
                        {lead.email && (
                          <p className="text-sm text-gray-500">{lead.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{lead.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead.campaign ? (
                        <div>
                          <p className="text-gray-900">{lead.campaign.name}</p>
                          <p className="text-xs text-gray-500">{lead.campaign.insurer}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.agent ? (
                        <span className="text-gray-900">{lead.agent.full_name}</span>
                      ) : (
                        <span className="text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {lead.last_contact_date
                        ? new Date(lead.last_contact_date).toLocaleDateString('es-ES')
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowPhoneFor(lead.id);
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                          title="Llamar"
                        >
                          <Phone size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setModalMode('view');
                            setShowModal(true);
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setModalMode('edit');
                            setShowModal(true);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay leads para mostrar
            </div>
          )}
        </div>
      )}

      {/* SoftPhone Modal */}
      {showPhoneFor && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowPhoneFor(null)}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
            >
              ✕
            </button>
            <SoftPhone
              autoDialNumber={selectedLead.phone}
              onCallStart={(phoneNumber, callId) => 
                handleCallStart(selectedLead.id, phoneNumber, callId)
              }
              onCallEnd={handleCallEnd}
            />
          </div>
        </div>
      )}

      {/* Lead Modal */}
      {showModal && (
        <LeadModal
          lead={modalMode === 'create' ? null : selectedLead}
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            setSelectedLead(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedLead(null);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
}
