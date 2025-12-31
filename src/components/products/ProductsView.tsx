import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/supabase';
import type { Product, Campaign } from '../../types';
import { Plus, Edit, Eye } from 'lucide-react';
import ProductModal from './ProductModal';

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [productsData, campaignsData] = await Promise.all([
        apiRequest('/products'),
        apiRequest('/campaigns'),
      ]);
      setProducts(productsData.products);
      setCampaigns(campaignsData.campaigns);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTypeColor(type: string) {
    const colors: Record<string, string> = {
      salud: 'bg-blue-100 text-blue-800',
      coche: 'bg-green-100 text-green-800',
      vida: 'bg-purple-100 text-purple-800',
      hogar: 'bg-yellow-100 text-yellow-800',
      otro: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  const filteredProducts = filterCampaign === 'all'
    ? products
    : products.filter(p => p.campaign_id === filterCampaign);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-gray-900">Gestión de Productos</h2>
        <button
          onClick={() => {
            setModalMode('create');
            setSelectedProduct(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <select
          value={filterCampaign}
          onChange={(e) => setFilterCampaign(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas las campañas</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg text-gray-900 mb-1">{product.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${getTypeColor(product.type)}`}>
                    {product.type}
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>

              {product.campaign && (
                <div className="mb-4 text-sm">
                  <p className="text-gray-600">Campaña:</p>
                  <p className="text-gray-900">{product.campaign.name}</p>
                  <p className="text-gray-500 text-xs">{product.campaign.insurer}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600">Comisión Base:</p>
                <p className="text-2xl text-gray-900">{product.base_commission}%</p>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedProduct(product);
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
                    setSelectedProduct(product);
                    setModalMode('edit');
                    setShowModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Editar
                </button>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No hay productos creados
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ProductModal
          product={modalMode === 'create' ? null : selectedProduct}
          mode={modalMode}
          campaigns={campaigns}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedProduct(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
