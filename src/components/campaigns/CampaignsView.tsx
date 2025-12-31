import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/supabase';
import type { Campaign } from '../../types';
import { Plus, Edit, Eye, Pause, Play } from 'lucide-react';
import CampaignModal from './CampaignModal';

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const data = await apiRequest('/campaigns');
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCampaignStatus(campaign: Campaign) {
    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      await apiRequest(`/campaigns/${campaign.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-gray-900">Gestión de Campañas</h2>
        <button
          onClick={() => {
            setModalMode('create');
            setSelectedCampaign(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Campaña
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg text-gray-900">{campaign.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{campaign.insurer}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {campaign.description || 'Sin descripción'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>
                  {campaign.products?.length || 0} productos
                </span>
                <span>
                  Creada: {new Date(campaign.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setModalMode('view');
                    setShowModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Ver
                </button>
                <button
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setModalMode('edit');
                    setShowModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Editar
                </button>
                <button
                  onClick={() => toggleCampaignStatus(campaign)}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center ${
                    campaign.status === 'active'
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title={campaign.status === 'active' ? 'Pausar' : 'Activar'}
                >
                  {campaign.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No hay campañas creadas
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CampaignModal
          campaign={modalMode === 'create' ? null : selectedCampaign}
          mode={modalMode}
          onClose={() => {
            setShowModal(false);
            setSelectedCampaign(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedCampaign(null);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}
