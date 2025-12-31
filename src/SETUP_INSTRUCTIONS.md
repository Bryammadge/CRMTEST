# Instrucciones de Configuración Paso a Paso

## 🔧 Setup Completo del CRM

### Paso 1: Configurar Base de Datos Supabase

#### 1.1 Crear las tablas

Accede a tu proyecto Supabase → SQL Editor → New Query

Ejecuta este script SQL completo:

```sql
-- =====================================================
-- PASO 1: CREAR EXTENSION UUID (si no existe)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PASO 2: TABLA PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
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

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PASO 3: TABLA CAMPAIGNS
-- =====================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  insurer TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view campaigns" ON campaigns 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage campaigns" ON campaigns 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PASO 4: TABLA PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('salud', 'coche', 'vida', 'hogar', 'otro')),
  description TEXT,
  base_commission DECIMAL(10,2) DEFAULT 0,
  custom_form_fields JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_campaign ON products(campaign_id);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view products" ON products 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage products" ON products 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PASO 5: TABLA LEADS
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  assigned_agent UUID REFERENCES profiles(id),
  assigned_supervisor UUID REFERENCES profiles(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dni TEXT,
  status TEXT DEFAULT 'nuevo' CHECK (status IN (
    'nuevo', 'contactado', 'interesado', 'no_interesado', 
    'no_contesta', 'venta', 'venta_validada', 'perdido'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('baja', 'normal', 'alta', 'urgente')),
  source TEXT,
  last_contact_date TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see only assigned leads" ON leads 
  FOR SELECT USING (
    assigned_agent = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Agents can update assigned leads" ON leads 
  FOR UPDATE USING (
    assigned_agent = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Supervisors and admins can insert leads" ON leads 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- =====================================================
-- PASO 6: TABLA CALLS
-- =====================================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  phone_number TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('outbound', 'inbound')),
  status TEXT CHECK (status IN ('ringing', 'answered', 'no_answer', 'busy', 'failed', 'completed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  talk_time_seconds INTEGER,
  sip_call_id TEXT,
  recording_url TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_agent ON calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(started_at);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see only their calls" ON calls 
  FOR SELECT USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Agents can insert their calls" ON calls 
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their calls" ON calls 
  FOR UPDATE USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- =====================================================
-- PASO 7: TABLA SALES
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  agent_id UUID REFERENCES profiles(id) NOT NULL,
  supervisor_id UUID REFERENCES profiles(id),
  policy_number TEXT UNIQUE,
  premium_amount DECIMAL(10,2) NOT NULL,
  payment_frequency TEXT CHECK (payment_frequency IN ('mensual', 'trimestral', 'semestral', 'anual')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'cancelled')),
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  agent_commission DECIMAL(10,2),
  supervisor_commission DECIMAL(10,2),
  customer_data JSONB,
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_agent ON sales(agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see only their sales" ON sales 
  FOR SELECT USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

CREATE POLICY "Agents can create sales" ON sales 
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Supervisors can update sales" ON sales 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
  );

-- =====================================================
-- PASO 8: TABLA LEAD_HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_history_lead ON lead_history(lead_id);

ALTER TABLE lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of accessible leads" ON lead_history 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads 
      WHERE id = lead_id AND (
        assigned_agent = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
        )
      )
    )
  );

-- =====================================================
-- PASO 9: TABLA PERMISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  UNIQUE(role, resource, action)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view permissions" ON permissions 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insertar permisos por defecto
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
('admin', 'products', 'create', true),
('admin', 'products', 'read', true),
('admin', 'products', 'update', true),

-- SUPERVISOR
('supervisor', 'leads', 'read', true),
('supervisor', 'leads', 'assign', true),
('supervisor', 'calls', 'listen', true),
('supervisor', 'sales', 'validate', true),
('supervisor', 'reports', 'read', true),
('supervisor', 'products', 'read', true),

-- AGENT
('agent', 'leads', 'read', true),
('agent', 'calls', 'create', true),
('agent', 'calls', 'read', true),
('agent', 'sales', 'create', true),
('agent', 'sales', 'read', true)
ON CONFLICT (role, resource, action) DO NOTHING;

-- =====================================================
-- PASO 10: TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registrar cambios en lead_history
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO lead_history (lead_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_status 
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();
```

### Paso 2: Crear Usuarios de Prueba

Usa Postman, curl o Thunder Client para crear usuarios:

```bash
# Crear Admin
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-15630662/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "admin@crm.com",
    "password": "password123",
    "full_name": "Admin Principal",
    "role": "admin"
  }'

# Crear Supervisor
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-15630662/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "supervisor@crm.com",
    "password": "password123",
    "full_name": "Supervisor Equipo 1",
    "role": "supervisor"
  }'

# Crear Agente
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-15630662/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "agent@crm.com",
    "password": "password123",
    "full_name": "Agente Juan Pérez",
    "role": "agent"
  }'
```

### Paso 3: Crear Datos de Prueba (Opcional)

Ejecuta este SQL para crear datos de ejemplo:

```sql
-- Crear campaña de ejemplo
INSERT INTO campaigns (name, description, insurer, status) VALUES
('Campaña Seguros Salud Q1 2025', 'Promoción especial de seguros de salud', 'MAPFRE', 'active');

-- Obtener ID de la campaña (usa el ID real que se generó)
-- Reemplaza 'campaign_id_here' con el UUID real

-- Crear productos
INSERT INTO products (campaign_id, name, type, description, base_commission) VALUES
('campaign_id_here', 'Seguro Salud Premium', 'salud', 'Cobertura completa con hospitalización', 15.00),
('campaign_id_here', 'Seguro Salud Básico', 'salud', 'Cobertura ambulatoria', 10.00);

-- Crear leads de prueba
INSERT INTO leads (
  first_name, last_name, phone, email, dni, 
  status, priority, campaign_id, source, assigned_agent
) VALUES
('María', 'González', '612345678', 'maria.gonzalez@email.com', '12345678A', 'nuevo', 'alta', 'campaign_id_here', 'Web', 'agent_user_id'),
('Pedro', 'Martínez', '623456789', 'pedro.martinez@email.com', '23456789B', 'contactado', 'normal', 'campaign_id_here', 'Referido', 'agent_user_id'),
('Ana', 'López', '634567890', 'ana.lopez@email.com', '34567890C', 'interesado', 'urgente', 'campaign_id_here', 'Llamada entrante', 'agent_user_id');
```

### Paso 4: Verificar Instalación

1. Inicia sesión con `admin@crm.com` / `password123`
2. Verifica que aparece el dashboard
3. Navega a "Leads" - deberían aparecer los leads de prueba
4. Click en "LLAMAR" para probar el softphone (modo demo)
5. Navega a "Campañas" - debería aparecer la campaña de ejemplo

### Paso 5: Configuración SIP (Producción)

Para habilitar llamadas reales, configura en tu archivo `.env`:

```env
VITE_SIP_WEBSOCKET_URL=wss://tu-servidor-sip.com:8089/ws
VITE_SIP_DOMAIN=tu-dominio.com
VITE_STUN_SERVER=stun:stun.l.google.com:19302
```

Ver `ARCHITECTURE.md` sección 7.2 para proveedores recomendados.

---

## ✅ Checklist de Configuración

- [ ] Proyecto Supabase creado
- [ ] Script SQL ejecutado (tablas creadas)
- [ ] RLS policies habilitadas
- [ ] Edge Function desplegada
- [ ] Usuario admin creado
- [ ] Login funciona correctamente
- [ ] Dashboard muestra datos
- [ ] Softphone abre en modo demo
- [ ] (Opcional) SIP configurado para producción

## 🆘 Troubleshooting

**"Error: relation does not exist"**
→ Las tablas no se crearon. Ejecuta el script SQL completo.

**"Error: permission denied"**
→ RLS policies no configuradas correctamente. Revisa las policies.

**"Error creating user"**
→ Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada en el backend.

**Softphone no marca**
→ Es normal en modo demo. Configura variables de entorno SIP para llamadas reales.

---

¡El CRM está listo para usar! 🎉
