import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import LeadsTable from './components/leads/LeadsTable';
import CampaignsView from './components/campaigns/CampaignsView';
import ProductsView from './components/products/ProductsView';
import SalesView from './components/sales/SalesView';
import CallsView from './components/calls/CallsView';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'leads' && <LeadsTable />}
          {currentView === 'calls' && <CallsView />}
          {currentView === 'sales' && <SalesView />}
          {currentView === 'campaigns' && <CampaignsView />}
          {currentView === 'products' && <ProductsView />}
          {currentView === 'reports' && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <h2 className="text-2xl text-gray-900 mb-4">Reportes Avanzados</h2>
              <p className="text-gray-600">
                Exportación a Excel, análisis de conversión, ROI por campaña.
              </p>
            </div>
          )}
          {currentView === 'users' && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <h2 className="text-2xl text-gray-900 mb-4">Gestión de Usuarios</h2>
              <p className="text-gray-600">
                Crear y editar usuarios con roles: Admin, Supervisor, Agente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}