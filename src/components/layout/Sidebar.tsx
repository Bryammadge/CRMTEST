import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Phone, 
  TrendingUp, 
  ShoppingCart,
  Settings,
  LogOut,
  Target,
  Package,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const { profile, signOut, hasPermission } = useAuth();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['admin', 'supervisor', 'agent'] 
    },
    { 
      id: 'leads', 
      label: 'Leads', 
      icon: Users, 
      roles: ['admin', 'supervisor', 'agent'] 
    },
    { 
      id: 'calls', 
      label: 'Llamadas', 
      icon: Phone, 
      roles: ['admin', 'supervisor', 'agent'] 
    },
    { 
      id: 'sales', 
      label: 'Ventas', 
      icon: TrendingUp, 
      roles: ['admin', 'supervisor', 'agent'] 
    },
    { 
      id: 'campaigns', 
      label: 'Campañas', 
      icon: Target, 
      roles: ['admin', 'supervisor'] 
    },
    { 
      id: 'products', 
      label: 'Productos', 
      icon: Package, 
      roles: ['admin', 'supervisor'] 
    },
    { 
      id: 'reports', 
      label: 'Reportes', 
      icon: BarChart3, 
      roles: ['admin', 'supervisor'] 
    },
    { 
      id: 'users', 
      label: 'Usuarios', 
      icon: Settings, 
      roles: ['admin'] 
    },
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(profile?.role || '')
  );

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl">CRM Seguros</h2>
        <p className="text-sm text-gray-400 mt-1">{profile?.full_name}</p>
        <span className="inline-block mt-2 px-2 py-1 bg-blue-600 rounded text-xs uppercase">
          {profile?.role}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
