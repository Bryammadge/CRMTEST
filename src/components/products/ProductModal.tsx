import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/supabase';
import type { Product, Campaign } from '../../types';
import { X } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  mode: 'create' | 'edit' | 'view';
  campaigns: Campaign[];
  onClose: () => void;
  onSave: () => void;
}

export default function ProductModal({ product, mode, campaigns, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'salud' as const,
    description: '',
    campaign_id: '',
    base_commission: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReadOnly = mode === 'view';

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        type: product.type,
        description: product.description || '',
        campaign_id: product.campaign_id,
        base_commission: product.base_commission,
        is_active: product.is_active,
      });
    }
  }, [product]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'create') {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      } else if (mode === 'edit' && product) {
        await apiRequest(`/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      }
      
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl text-gray-900">
            {mode === 'create' && 'Crear Nuevo Producto'}
            {mode === 'edit' && 'Editar Producto'}
            {mode === 'view' && 'Detalles del Producto'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="Ej: Seguro de Salud Premium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Tipo de Seguro *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="salud">Salud</option>
                <option value="coche">Coche</option>
                <option value="vida">Vida</option>
                <option value="hogar">Hogar</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Campaña *
              </label>
              <select
                value={formData.campaign_id}
                onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                required
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              >
                <option value="">Seleccionar campaña</option>
                {campaigns.filter(c => c.status === 'active').map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
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
              placeholder="Describe las características y coberturas del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Comisión Base (%) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.base_commission}
                onChange={(e) => setFormData({ ...formData, base_commission: parseFloat(e.target.value) })}
                required
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje de comisión para el agente
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Estado
              </label>
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.is_active}
                    onChange={() => setFormData({ ...formData, is_active: true })}
                    disabled={isReadOnly}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.is_active}
                    onChange={() => setFormData({ ...formData, is_active: false })}
                    disabled={isReadOnly}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Inactivo</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              💡 <strong>Formularios Dinámicos</strong>
            </p>
            <p className="text-xs text-gray-600">
              En producción, aquí se configurarían campos personalizados para cada tipo de seguro
              (ej: para seguros de coche: marca, modelo, año; para salud: preexistencias, edad, etc.)
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Estos campos se almacenarían en <code className="bg-blue-100 px-1">custom_form_fields</code> (JSONB)
              y se renderizarían dinámicamente en el formulario de venta.
            </p>
          </div>

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
