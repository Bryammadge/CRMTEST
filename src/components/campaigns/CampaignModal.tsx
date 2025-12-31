import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/supabase';
import type { Campaign } from '../../types';
import { X } from 'lucide-react';

interface CampaignModalProps {
  campaign: Campaign | null;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
  onSave: () => void;
}

export default function CampaignModal({ campaign, mode, onClose, onSave }: CampaignModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    insurer: '',
    status: 'active' as const,
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReadOnly = mode === 'view';

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description || '',
        insurer: campaign.insurer,
        status: campaign.status,
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
      });
    }
  }, [campaign]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'create') {
        await apiRequest('/campaigns', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      } else if (mode === 'edit' && campaign) {
        await apiRequest(`/campaigns/${campaign.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      }
      
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la campaña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl text-gray-900">
            {mode === 'create' && 'Crear Nueva Campaña'}
            {mode === 'edit' && 'Editar Campaña'}
            {mode === 'view' && 'Detalles de la Campaña'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Nombre de la Campaña *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Ej: Campaña Seguros de Salud Q1 2025"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Aseguradora *
            </label>
            <input
              type="text"
              value={formData.insurer}
              onChange={(e) => setFormData({ ...formData, insurer: e.target.value })}
              required
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Ej: MAPFRE, Sanitas, AXA..."
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isReadOnly}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Describe el objetivo y características de la campaña..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            >
              <option value="active">Activa</option>
              <option value="paused">Pausada</option>
              <option value="completed">Completada</option>
            </select>
          </div>

          {mode === 'view' && campaign?.products && campaign.products.length > 0 && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Productos Asociados
              </label>
              <div className="space-y-2">
                {campaign.products.map((product) => (
                  <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {product.type} - Comisión base: {product.base_commission}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
