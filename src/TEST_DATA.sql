-- =====================================================
-- DATOS DE PRUEBA PARA CRM CALL CENTER
-- =====================================================
-- Ejecutar este script DESPUÉS de crear las tablas y usuarios

-- =====================================================
-- 1. CAMPAÑAS DE EJEMPLO
-- =====================================================

-- Nota: Obtén el ID de tu usuario admin para 'created_by'
-- SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;
-- Reemplaza 'ADMIN_USER_ID' con el ID real

INSERT INTO campaigns (name, description, insurer, status, start_date, end_date, created_by) VALUES
('Campaña Seguros de Salud Q1 2025', 'Promoción especial de seguros de salud con descuentos del 20% para nuevos clientes', 'MAPFRE', 'active', '2025-01-01', '2025-03-31', 'ADMIN_USER_ID'),
('Campaña Seguros de Coche Verano 2025', 'Oferta de verano para seguros de automóvil con cobertura completa', 'AXA', 'active', '2025-06-01', '2025-08-31', 'ADMIN_USER_ID'),
('Campaña Seguros de Vida Familiar', 'Protección integral para toda la familia', 'Sanitas', 'active', '2025-01-01', '2025-12-31', 'ADMIN_USER_ID'),
('Campaña Seguros de Hogar - Invierno', 'Protege tu hogar en la temporada de lluvias', 'Allianz', 'paused', '2024-11-01', '2025-02-28', 'ADMIN_USER_ID');

-- =====================================================
-- 2. PRODUCTOS DE EJEMPLO
-- =====================================================

-- Nota: Obtén los IDs de las campañas creadas
-- SELECT id, name FROM campaigns;
-- Reemplaza 'CAMPAIGN_SALUD_ID', 'CAMPAIGN_COCHE_ID', etc. con IDs reales

-- Productos de Salud
INSERT INTO products (campaign_id, name, type, description, base_commission, is_active) VALUES
('CAMPAIGN_SALUD_ID', 'Seguro Salud Premium', 'salud', 'Cobertura completa con hospitalización, urgencias 24/7, y medicina preventiva', 15.00, true),
('CAMPAIGN_SALUD_ID', 'Seguro Salud Básico', 'salud', 'Cobertura ambulatoria y consultas médicas generales', 10.00, true),
('CAMPAIGN_SALUD_ID', 'Seguro Salud Dental', 'salud', 'Cobertura especializada en tratamientos dentales', 12.00, true);

-- Productos de Coche
INSERT INTO products (campaign_id, name, type, description, base_commission, is_active) VALUES
('CAMPAIGN_COCHE_ID', 'Seguro Todo Riesgo', 'coche', 'Cobertura total: daños propios, terceros, robo, y asistencia en carretera', 18.00, true),
('CAMPAIGN_COCHE_ID', 'Seguro a Terceros Plus', 'coche', 'Responsabilidad civil + lunas + robo', 12.00, true),
('CAMPAIGN_COCHE_ID', 'Seguro Básico Legal', 'coche', 'Responsabilidad civil obligatoria', 8.00, true);

-- Productos de Vida
INSERT INTO products (campaign_id, name, type, description, base_commission, is_active) VALUES
('CAMPAIGN_VIDA_ID', 'Seguro de Vida Individual', 'vida', 'Protección financiera para tu familia en caso de fallecimiento', 20.00, true),
('CAMPAIGN_VIDA_ID', 'Seguro de Vida Familiar', 'vida', 'Cobertura para toda la familia con capital asegurado flexible', 22.00, true);

-- Productos de Hogar
INSERT INTO products (campaign_id, name, type, description, base_commission, is_active) VALUES
('CAMPAIGN_HOGAR_ID', 'Seguro Hogar Completo', 'hogar', 'Cobertura de continente y contenido, robo, incendio, inundación', 14.00, true),
('CAMPAIGN_HOGAR_ID', 'Seguro Hogar Básico', 'hogar', 'Cobertura de continente y responsabilidad civil', 10.00, true);

-- =====================================================
-- 3. LEADS DE EJEMPLO
-- =====================================================

-- Nota: Obtén IDs de agentes y supervisores
-- SELECT id, full_name, role FROM profiles WHERE role IN ('agent', 'supervisor');
-- Reemplaza 'AGENT_ID' y 'SUPERVISOR_ID' con IDs reales

INSERT INTO leads (
  first_name, last_name, phone, email, dni,
  status, priority, source,
  campaign_id, assigned_agent, assigned_supervisor,
  notes
) VALUES
-- Leads para campaña de Salud
('María', 'González Pérez', '612345678', 'maria.gonzalez@email.com', '12345678A', 
 'nuevo', 'alta', 'Web - Formulario contacto', 
 'CAMPAIGN_SALUD_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Interesada en seguro familiar. Tiene 2 hijos.'),

('Pedro', 'Martínez López', '623456789', 'pedro.martinez@email.com', '23456789B',
 'contactado', 'normal', 'Referido - Cliente actual',
 'CAMPAIGN_SALUD_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Primera llamada realizada. Solicita presupuesto detallado.'),

('Ana', 'López Fernández', '634567890', 'ana.lopez@email.com', '34567890C',
 'interesado', 'urgente', 'Llamada entrante',
 'CAMPAIGN_SALUD_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Muy interesada. Quiere contratar esta semana. Llamar mañana.'),

('Carlos', 'Rodríguez Sanz', '645678901', 'carlos.rodriguez@email.com', '45678901D',
 'no_contesta', 'baja', 'Web - Formulario contacto',
 'CAMPAIGN_SALUD_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'No responde. 3 intentos realizados.'),

-- Leads para campaña de Coche
('Laura', 'Sánchez García', '656789012', 'laura.sanchez@email.com', '56789012E',
 'nuevo', 'alta', 'Publicidad Facebook',
 'CAMPAIGN_COCHE_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Compró coche nuevo hace 1 mes. Necesita seguro urgente.'),

('Miguel', 'Torres Ruiz', '667890123', 'miguel.torres@email.com', '67890123F',
 'contactado', 'normal', 'Google Ads',
 'CAMPAIGN_COCHE_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Comparando precios con otras aseguradoras. Enviar presupuesto.'),

('Elena', 'Ramírez Díaz', '678901234', 'elena.ramirez@email.com', '78901234G',
 'interesado', 'alta', 'Referido - Amigo',
 'CAMPAIGN_COCHE_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Le interesa Todo Riesgo. Tiene coche de alta gama.'),

-- Leads para campaña de Vida
('Javier', 'Morales Castro', '689012345', 'javier.morales@email.com', '89012345H',
 'nuevo', 'normal', 'Web - Formulario contacto',
 'CAMPAIGN_VIDA_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Padre de familia. Busca protección para esposa e hijos.'),

('Isabel', 'Navarro Vega', '690123456', 'isabel.navarro@email.com', '90123456I',
 'contactado', 'alta', 'Llamada entrante',
 'CAMPAIGN_VIDA_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'Acaba de ser madre. Muy interesada en seguro familiar.'),

('Roberto', 'Giménez Ortiz', '601234567', 'roberto.gimenez@email.com', '01234567J',
 'venta', 'urgente', 'Referido - Cliente actual',
 'CAMPAIGN_VIDA_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'VENTA CERRADA - Pendiente de validación supervisor');

-- =====================================================
-- 4. LLAMADAS DE EJEMPLO (Historial)
-- =====================================================

-- Nota: Reemplaza 'LEAD_ID_1', 'LEAD_ID_2', etc. con IDs reales de leads
-- SELECT id, first_name, last_name FROM leads LIMIT 5;

INSERT INTO calls (
  lead_id, agent_id, phone_number, direction, status,
  started_at, answered_at, ended_at,
  duration_seconds, talk_time_seconds,
  outcome, notes
) VALUES
-- Llamadas exitosas
('LEAD_ID_1', 'AGENT_ID', '612345678', 'outbound', 'completed',
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes',
 300, 280,
 'Interesado - Enviar presupuesto', 'Cliente muy amable. Solicita información de coberturas.'),

('LEAD_ID_2', 'AGENT_ID', '623456789', 'outbound', 'completed',
 NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 50 minutes',
 600, 550,
 'Solicita presupuesto', 'Llamada larga. Explicadas todas las opciones.'),

('LEAD_ID_3', 'AGENT_ID', '634567890', 'outbound', 'completed',
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 minutes',
 480, 450,
 'Muy interesado - Seguimiento urgente', 'Quiere contratar. Programar llamada mañana.'),

-- Llamadas sin respuesta
('LEAD_ID_4', 'AGENT_ID', '645678901', 'outbound', 'no_answer',
 NOW() - INTERVAL '4 hours', NULL, NOW() - INTERVAL '4 hours' + INTERVAL '30 seconds',
 30, 0,
 'No contesta', 'Buzón de voz. Dejar mensaje.'),

-- Llamada entrante
('LEAD_ID_5', 'AGENT_ID', '656789012', 'inbound', 'completed',
 NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours 52 minutes',
 420, 400,
 'Nuevo lead - Muy urgente', 'Cliente llamó directamente. Necesita seguro YA.');

-- =====================================================
-- 5. VENTAS DE EJEMPLO
-- =====================================================

-- Nota: Reemplaza IDs de leads, productos y agentes con valores reales

INSERT INTO sales (
  lead_id, product_id, agent_id, supervisor_id,
  policy_number, premium_amount, payment_frequency,
  status, agent_commission, supervisor_commission,
  customer_data
) VALUES
-- Venta pendiente de validación
('LEAD_ID_ROBERTO', 'PRODUCT_VIDA_INDIVIDUAL_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'POL-2025-001', 850.00, 'anual',
 'pending', 170.00, 17.00,
 '{"edad": 35, "profesion": "Ingeniero", "capital_asegurado": "200000", "beneficiarios": "Esposa e hijos"}'),

-- Venta validada
('LEAD_ID_ANA', 'PRODUCT_SALUD_PREMIUM_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'POL-2025-002', 1200.00, 'mensual',
 'validated', 180.00, 18.00,
 '{"edad": 42, "preexistencias": "Ninguna", "tipo_cobertura": "Familiar"}'),

-- Otra venta validada
('LEAD_ID_ELENA', 'PRODUCT_COCHE_TODO_RIESGO_ID', 'AGENT_ID', 'SUPERVISOR_ID',
 'POL-2025-003', 650.00, 'trimestral',
 'validated', 117.00, 11.70,
 '{"marca": "BMW", "modelo": "Serie 3", "año": "2023", "uso": "Particular"}');

-- =====================================================
-- 6. VERIFICAR DATOS CREADOS
-- =====================================================

-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM campaigns) as total_campaigns,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM leads) as total_leads,
  (SELECT COUNT(*) FROM calls) as total_calls,
  (SELECT COUNT(*) FROM sales) as total_sales;

-- Ver leads por estado
SELECT status, COUNT(*) as cantidad
FROM leads
GROUP BY status
ORDER BY cantidad DESC;

-- Ver productos por tipo
SELECT type, COUNT(*) as cantidad
FROM products
GROUP BY type
ORDER BY cantidad DESC;

-- Ver ventas por estado
SELECT status, COUNT(*) as cantidad, SUM(premium_amount) as total_ingresos
FROM sales
GROUP BY status;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Reemplaza todos los placeholders con IDs reales:
--    - ADMIN_USER_ID
--    - CAMPAIGN_SALUD_ID, CAMPAIGN_COCHE_ID, etc.
--    - PRODUCT_*_ID
--    - AGENT_ID, SUPERVISOR_ID
--    - LEAD_ID_*
--
-- 2. Para obtener IDs:
--    SELECT id, name FROM campaigns;
--    SELECT id, full_name FROM profiles WHERE role = 'agent';
--    SELECT id, first_name, last_name FROM leads;
--
-- 3. Ejecuta este script en secciones, obteniendo IDs
--    y reemplazándolos antes de ejecutar la siguiente sección.
--
-- 4. Después de ejecutar, verifica en la app web que
--    aparezcan todos los datos.

-- =====================================================
-- FIN DEL SCRIPT DE DATOS DE PRUEBA
-- =====================================================
