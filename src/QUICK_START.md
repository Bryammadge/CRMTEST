# Guía de Inicio Rápido - CRM Call Center

## ⚡ 5 Minutos hasta el Primer Login

### Paso 1: Copiar el Schema SQL (1 min)

1. Abre tu proyecto Supabase
2. Ve a **SQL Editor** → **New Query**
3. Copia TODO el contenido de `SETUP_INSTRUCTIONS.md` (sección SQL)
4. Pega y ejecuta
5. ✅ Verifica que aparezcan 9 tablas en **Database** → **Tables**

### Paso 2: Crear Usuario Admin (2 min)

Opción A - Usar Thunder Client / Postman:
```
POST https://TU_PROJECT_ID.supabase.co/functions/v1/make-server-15630662/auth/signup

Headers:
  Content-Type: application/json
  Authorization: Bearer TU_ANON_KEY

Body:
{
  "email": "admin@crm.com",
  "password": "password123",
  "full_name": "Admin Principal",
  "role": "admin"
}
```

Opción B - Usar la aplicación web:
1. La app ya está corriendo en Figma Make
2. Click en "Sign Up" (si existe) o espera al siguiente paso
3. Usa la consola de Supabase para crear el usuario manualmente

### Paso 3: Login (30 seg)

1. Abre la aplicación
2. Usa estas credenciales:
   - Email: `admin@crm.com`
   - Password: `password123`
3. ✅ Deberías ver el Dashboard

### Paso 4: Crear Datos de Prueba (1 min)

En Supabase SQL Editor:

```sql
-- Crear una campaña
INSERT INTO campaigns (name, description, insurer, status)
VALUES ('Campaña Salud 2025', 'Promoción Q1', 'MAPFRE', 'active')
RETURNING id;

-- Copiar el ID generado y usarlo abajo (reemplaza 'CAMPAIGN_ID_AQUI')

-- Crear producto
INSERT INTO products (campaign_id, name, type, base_commission)
VALUES ('CAMPAIGN_ID_AQUI', 'Seguro Salud Premium', 'salud', 15.00);

-- Obtener ID del agente admin (para asignar leads)
SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;

-- Crear leads (reemplaza 'AGENT_ID_AQUI' con el ID del admin)
INSERT INTO leads (first_name, last_name, phone, email, status, priority, campaign_id, assigned_agent)
VALUES 
  ('María', 'González', '612345678', 'maria@example.com', 'nuevo', 'alta', 'CAMPAIGN_ID_AQUI', 'AGENT_ID_AQUI'),
  ('Pedro', 'Martínez', '623456789', 'pedro@example.com', 'contactado', 'normal', 'CAMPAIGN_ID_AQUI', 'AGENT_ID_AQUI'),
  ('Ana', 'López', '634567890', 'ana@example.com', 'interesado', 'urgente', 'CAMPAIGN_ID_AQUI', 'AGENT_ID_AQUI');
```

### Paso 5: Probar el Sistema (1 min)

✅ **Dashboard**: Ver KPIs
✅ **Leads**: Ver los 3 leads de prueba
✅ **Softphone**: Click en botón "LLAMAR" (verde) → Se abre el softphone
✅ **Campañas**: Ver la campaña creada
✅ **Productos**: Ver el producto creado

---

## 🎯 Flujo Completo de Uso

### Como Agente:

1. **Login** → `agent@crm.com` (créalo primero)
2. **Dashboard** → Ver tus KPIs
3. **Leads** → Ver leads asignados
4. **Click "LLAMAR"** → Se abre softphone
5. **Durante llamada** → Toma notas
6. **Después de llamada** → Actualiza estado del lead
7. **Si es venta** → Registrar en "Ventas"

### Como Supervisor:

1. **Login** → `supervisor@crm.com`
2. **Dashboard** → Ver rendimiento del equipo
3. **Leads** → Asignar leads a agentes
4. **Ventas** → Validar o rechazar ventas pendientes
5. **Reportes** → Analizar métricas

### Como Admin:

1. **Login** → `admin@crm.com`
2. **Dashboard** → Métricas globales
3. **Campañas** → Crear nueva campaña
4. **Productos** → Asociar productos a campaña
5. **Usuarios** → Crear agentes y supervisores
6. **Reportes** → Exportar datos

---

## 🔧 Configuración Avanzada (Opcional)

### Para Llamadas SIP Reales

Crea archivo `.env` en la raíz:

```env
VITE_SIP_WEBSOCKET_URL=wss://tu-servidor-sip.com:8089/ws
VITE_SIP_DOMAIN=tu-dominio.com
VITE_STUN_SERVER=stun:stun.l.google.com:19302
```

**Proveedores Recomendados:**
- **Twilio**: Más fácil, API completa
- **VoIP.ms**: Económico, flexible
- **Asterisk**: Self-hosted, control total

Ver `ARCHITECTURE.md` sección 7 para detalles.

---

## 📱 Crear Usuarios Adicionales

### Crear Agente:

```sql
-- Método directo en Supabase (usando Auth UI)
-- O usar el endpoint /auth/signup

POST /auth/signup
{
  "email": "agente1@crm.com",
  "password": "password123",
  "full_name": "Juan Pérez",
  "role": "agent"
}
```

### Crear Supervisor:

```sql
POST /auth/signup
{
  "email": "supervisor1@crm.com",
  "password": "password123",
  "full_name": "Laura Supervisora",
  "role": "supervisor"
}
```

---

## 🐛 Solución de Problemas Rápida

### "Error: relation does not exist"
→ No ejecutaste el SQL. Ve a Paso 1.

### "Error: Unauthorized"
→ Verifica que el usuario exista en tabla `profiles`.

### "No veo leads"
→ Los agentes solo ven sus leads asignados. Verifica `assigned_agent`.

### "Softphone no marca"
→ Normal en modo demo. Configura SIP para llamadas reales.

### "Error 401 en API"
→ Verifica que Supabase esté conectado y el token sea válido.

---

## ✅ Checklist de Verificación

Después del Quick Start, deberías poder:

- [ ] Login con admin@crm.com
- [ ] Ver el Dashboard con KPIs
- [ ] Navegar a "Leads" y ver 3 leads
- [ ] Click en "LLAMAR" y ver el softphone
- [ ] Navegar a "Campañas" y ver 1 campaña
- [ ] Navegar a "Productos" y ver 1 producto
- [ ] Crear un nuevo lead manualmente
- [ ] Actualizar el estado de un lead
- [ ] Ver en "Llamadas" el historial (vacío al inicio)

Si todo funciona: **¡Felicidades! El CRM está listo.**

---

## 📚 Documentación Completa

- `README.md` - Guía completa de uso
- `ARCHITECTURE.md` - Arquitectura técnica
- `DATABASE_SCHEMA.md` - Schema de base de datos
- `SETUP_INSTRUCTIONS.md` - Setup detallado paso a paso
- `PROJECT_SUMMARY.md` - Resumen ejecutivo del proyecto

---

## 🚀 Próximos Pasos Recomendados

1. **Crear más usuarios** de prueba (agentes, supervisores)
2. **Asignar leads** a diferentes agentes
3. **Probar el flujo completo**: lead → llamada → venta → validación
4. **Configurar SIP** si quieres llamadas reales
5. **Personalizar** campañas y productos según tu negocio
6. **Importar leads** desde CSV/Excel (endpoint a crear)
7. **Configurar reportes** automáticos por email

---

## 💡 Tips Pro

- Los estados de lead son configurables en la BD
- Las comisiones se calculan automáticamente al crear venta
- El historial de leads se registra automáticamente con triggers
- Los permisos son 100% configurables en tabla `permissions`
- Supabase Realtime puede usarse para notificaciones en vivo

---

**¡Listo para vender seguros! 📞💰**

Si necesitas ayuda, consulta la documentación completa o revisa los comentarios en el código.
