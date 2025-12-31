# Esquema de Base de Datos - CRM Call Center Seguros

## Tablas Principales

### 1. users (Supabase Auth + metadata)
```sql
-- Usar auth.users de Supabase + tabla profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'agent')),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### 2. campaigns
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  insurer TEXT NOT NULL, -- Aseguradora
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
```

### 3. products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('salud', 'coche', 'vida', 'hogar', 'otro')),
  description TEXT,
  base_commission DECIMAL(10,2) DEFAULT 0, -- Comisión base en %
  custom_form_fields JSONB, -- Campos dinámicos del formulario
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_campaign ON products(campaign_id);
```

### 4. leads
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  assigned_agent UUID REFERENCES profiles(id),
  assigned_supervisor UUID REFERENCES profiles(id),
  
  -- Datos del lead
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dni TEXT,
  
  -- Estado y gestión
  status TEXT DEFAULT 'nuevo' CHECK (status IN (
    'nuevo', 'contactado', 'interesado', 'no_interesado', 
    'no_contesta', 'venta', 'venta_validada', 'perdido'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('baja', 'normal', 'alta', 'urgente')),
  
  -- Metadatos
  source TEXT, -- Origen del lead
  last_contact_date TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_agent ON leads(assigned_agent);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
```

### 5. calls
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  
  -- Datos de la llamada
  phone_number TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('outbound', 'inbound')),
  status TEXT CHECK (status IN ('ringing', 'answered', 'no_answer', 'busy', 'failed', 'completed')),
  
  -- Tiempos
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Duración total
  talk_time_seconds INTEGER, -- Tiempo de conversación
  
  -- SIP
  sip_call_id TEXT,
  recording_url TEXT, -- URL de grabación en Supabase Storage
  
  -- Resultado
  outcome TEXT, -- Resultado de la llamada
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_agent ON calls(agent_id);
CREATE INDEX idx_calls_lead ON calls(lead_id);
CREATE INDEX idx_calls_date ON calls(started_at);
```

### 6. sales
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  supervisor_id UUID REFERENCES profiles(id),
  
  -- Datos de la venta
  policy_number TEXT UNIQUE, -- Número de póliza
  premium_amount DECIMAL(10,2) NOT NULL, -- Prima
  payment_frequency TEXT CHECK (payment_frequency IN ('mensual', 'trimestral', 'semestral', 'anual')),
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'cancelled')),
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  
  -- Comisiones
  agent_commission DECIMAL(10,2),
  supervisor_commission DECIMAL(10,2),
  
  -- Datos del cliente (form dinámico)
  customer_data JSONB,
  
  -- Auditoría
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_agent ON sales(agent_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_date ON sales(sale_date);
```

### 7. lead_history
```sql
CREATE TABLE lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  
  action TEXT NOT NULL, -- 'status_change', 'note_added', 'assigned', 'call_made', etc.
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_history_lead ON lead_history(lead_id);
```

### 8. permissions
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL, -- 'leads', 'campaigns', 'users', 'reports', etc.
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'assign', etc.
  allowed BOOLEAN DEFAULT true,
  
  UNIQUE(role, resource, action)
);

-- Permisos por defecto
INSERT INTO permissions (role, resource, action, allowed) VALUES
-- ADMIN
('admin', 'campaigns', 'create', true),
('admin', 'campaigns', 'read', true),
('admin', 'campaigns', 'update', true),
('admin', 'campaigns', 'delete', true),
('admin', 'users', 'create', true),
('admin', 'users', 'read', true),
('admin', 'users', 'update', true),
('admin', 'users', 'delete', true),
('admin', 'leads', 'read', true),
('admin', 'leads', 'assign', true),
('admin', 'reports', 'read', true),

-- SUPERVISOR
('supervisor', 'leads', 'read', true),
('supervisor', 'leads', 'assign', true),
('supervisor', 'calls', 'listen', true),
('supervisor', 'sales', 'validate', true),
('supervisor', 'reports', 'read', true),

-- AGENT
('agent', 'leads', 'read', true), -- Solo sus leads
('agent', 'calls', 'make', true),
('agent', 'sales', 'create', true);
```

## Row Level Security (RLS)

### Leads
```sql
-- Agentes solo ven sus leads
CREATE POLICY "Agents see only assigned leads" ON leads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (
      (role = 'agent' AND leads.assigned_agent = auth.uid())
      OR role IN ('supervisor', 'admin')
    )
  )
);
```

### Calls
```sql
-- Agentes solo ven sus llamadas
CREATE POLICY "Agents see only their calls" ON calls FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (
      (role = 'agent' AND calls.agent_id = auth.uid())
      OR role IN ('supervisor', 'admin')
    )
  )
);
```

## Funciones y Triggers

### Auto-actualizar updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Registrar cambios en lead_history
```sql
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO lead_history (lead_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_status AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();
```

## Vistas para Reporting

### Vista de rendimiento de agentes
```sql
CREATE VIEW agent_performance AS
SELECT 
  p.id AS agent_id,
  p.full_name,
  COUNT(DISTINCT c.id) AS total_calls,
  COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) AS completed_calls,
  COUNT(DISTINCT s.id) AS total_sales,
  SUM(s.agent_commission) AS total_commission,
  AVG(c.duration_seconds) AS avg_call_duration
FROM profiles p
LEFT JOIN calls c ON c.agent_id = p.id
LEFT JOIN sales s ON s.agent_id = p.id
WHERE p.role = 'agent'
GROUP BY p.id, p.full_name;
```

## Índices de Performance
```sql
CREATE INDEX idx_calls_agent_date ON calls(agent_id, started_at);
CREATE INDEX idx_sales_agent_date ON sales(agent_id, sale_date);
CREATE INDEX idx_leads_agent_status ON leads(assigned_agent, status);
```
