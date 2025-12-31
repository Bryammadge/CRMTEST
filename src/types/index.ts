// Types for CRM Call Center

export type UserRole = 'admin' | 'supervisor' | 'agent';

export type LeadStatus = 
  | 'nuevo'
  | 'contactado'
  | 'interesado'
  | 'no_interesado'
  | 'no_contesta'
  | 'venta'
  | 'venta_validada'
  | 'perdido';

export type CallStatus = 
  | 'ringing'
  | 'answered'
  | 'no_answer'
  | 'busy'
  | 'failed'
  | 'completed';

export type SaleStatus = 'pending' | 'validated' | 'rejected' | 'cancelled';

export type ProductType = 'salud' | 'coche' | 'vida' | 'hogar' | 'otro';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  insurer: string;
  status: 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string;
  };
  products?: Product[];
}

export interface Product {
  id: string;
  campaign_id: string;
  name: string;
  type: ProductType;
  description?: string;
  base_commission: number;
  custom_form_fields?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  campaign?: {
    name: string;
    insurer: string;
  };
}

export interface Lead {
  id: string;
  campaign_id?: string;
  assigned_agent?: string;
  assigned_supervisor?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  dni?: string;
  status: LeadStatus;
  priority: 'baja' | 'normal' | 'alta' | 'urgente';
  source?: string;
  last_contact_date?: string;
  next_follow_up?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  campaign?: {
    name: string;
    insurer: string;
  };
  agent?: {
    full_name: string;
    email: string;
  };
  supervisor?: {
    full_name: string;
    email: string;
  };
}

export interface Call {
  id: string;
  lead_id?: string;
  agent_id: string;
  phone_number: string;
  direction: 'outbound' | 'inbound';
  status: CallStatus;
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  talk_time_seconds?: number;
  sip_call_id?: string;
  recording_url?: string;
  outcome?: string;
  notes?: string;
  created_at: string;
  agent?: {
    full_name: string;
  };
  lead?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export interface Sale {
  id: string;
  lead_id: string;
  product_id: string;
  agent_id: string;
  supervisor_id?: string;
  policy_number?: string;
  premium_amount: number;
  payment_frequency: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  status: SaleStatus;
  validated_by?: string;
  validated_at?: string;
  agent_commission?: number;
  supervisor_commission?: number;
  customer_data?: Record<string, any>;
  sale_date: string;
  created_at: string;
  updated_at: string;
  agent?: {
    full_name: string;
  };
  product?: {
    name: string;
    type: ProductType;
  };
  lead?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  user_id?: string;
  action: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export interface AgentPerformance {
  agent_id: string;
  full_name: string;
  total_calls: number;
  completed_calls: number;
  total_sales: number;
  total_commission: number;
  avg_call_duration: number;
}

export interface DailySummary {
  date: string;
  total_calls: number;
  completed_calls: number;
  total_sales: number;
  pending_sales: number;
  validated_sales: number;
  total_revenue: number;
}

export interface Permission {
  id: string;
  role: UserRole;
  resource: string;
  action: string;
  allowed: boolean;
}
