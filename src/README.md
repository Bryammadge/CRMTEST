# CRM Call Center para Seguros

## 🎯 Descripción

Sistema CRM profesional completo para call centers de seguros con integración de telefonía SIP, gestión de leads, campañas, ventas, y reportes avanzados. Diseñado para producción real con arquitectura escalable.

## 📋 Características Principales

### ✅ Gestión de Usuarios y Roles
- **3 roles**: Admin, Supervisor, Agente
- Sistema de permisos configurable
- Autenticación segura con Supabase Auth
- Row Level Security (RLS) en base de datos

### ✅ Gestión de Leads
- CRUD completo de leads
- Estados configurables (nuevo, contactado, interesado, venta, etc.)
- Priorización (baja, normal, alta, urgente)
- Asignación automática o manual a agentes
- Historial completo de interacciones
- Filtrado avanzado

### ✅ Telefonía SIP Integrada
- **Softphone embebido en la interfaz web**
- Botón "LLAMAR" en cada lead
- Marcación automática con un click
- Registro automático de llamadas en BD
- Grabación de llamadas (preparado)
- Compatible con Asterisk, FreePBX, Twilio, etc.

### ✅ Gestión de Campañas
- Creación de campañas por aseguradora
- Múltiples productos por campaña
- Estados: activa, pausada, completada
- Fechas de inicio y fin

### ✅ Productos de Seguros
- Tipos: salud, coche, vida, hogar
- Formularios dinámicos personalizables
- Configuración de comisiones por producto

### ✅ Ventas y Pólizas
- Registro completo de ventas
- Generación automática de números de póliza
- Validación por supervisor
- Cálculo automático de comisiones
- Historial de ventas por agente

### ✅ Dashboard y Reportes
- **Dashboard por rol** (diferentes vistas para Admin/Supervisor/Agente)
- KPIs en tiempo real
- Gráficos de rendimiento
- Reportes de productividad
- Exportación a CSV/Excel (preparado)

### ✅ Monitorización en Tiempo Real
- Estado de llamadas activas
- Rendimiento de agentes
- Métricas diarias actualizadas

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Hono)
- **Base de Datos**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth con RLS
- **Telefonía**: JsSIP (WebRTC/SIP)
- **Charts**: Recharts

### Estructura de Archivos
```
/
├── App.tsx                      # Componente principal
├── contexts/
│   └── AuthContext.tsx          # Contexto de autenticación
├── lib/
│   └── supabase.ts              # Cliente Supabase y helpers
├── types/
│   └── index.ts                 # TypeScript types
├── components/
│   ├── auth/
│   │   └── Login.tsx            # Pantalla de login
│   ├── layout/
│   │   └── Sidebar.tsx          # Navegación lateral
│   ├── dashboard/
│   │   └── Dashboard.tsx        # Dashboard principal
│   ├── leads/
│   │   ├── LeadsTable.tsx       # Tabla de leads
│   │   └── LeadModal.tsx        # Modal crear/editar lead
│   ├── campaigns/
│   │   ├── CampaignsView.tsx    # Gestión de campañas
│   │   └── CampaignModal.tsx    # Modal de campaña
│   ├── sales/
│   │   └── SalesView.tsx        # Gestión de ventas
│   ├── calls/
│   │   └── CallsView.tsx        # Historial de llamadas
│   └── sip/
│       └── SoftPhone.tsx        # Softphone SIP integrado
├── supabase/functions/server/
│   └── index.tsx                # Backend API (Hono)
├── DATABASE_SCHEMA.md           # Esquema completo de BD
├── ARCHITECTURE.md              # Documentación de arquitectura
└── README.md                    # Este archivo
```

## 🚀 Configuración e Instalación

### 1. Requisitos Previos
- Cuenta de Supabase (proyecto creado)
- Proveedor SIP (Asterisk, FreePBX, Twilio, etc.) - opcional para demo

### 2. Configuración de Supabase

#### 2.1 Crear las tablas en la base de datos

Accede a la consola SQL de Supabase y ejecuta el script completo disponible en `DATABASE_SCHEMA.md`. Esto creará:

- `profiles` - Perfiles de usuario
- `campaigns` - Campañas de ventas
- `products` - Productos de seguros
- `leads` - Base de leads
- `calls` - Registro de llamadas
- `sales` - Ventas y pólizas
- `lead_history` - Historial de cambios
- `permissions` - Permisos configurables

#### 2.2 Configurar Row Level Security (RLS)

Las políticas RLS ya están incluidas en el schema. Aseguran que:
- Agentes solo ven sus propios leads y llamadas
- Supervisores ven datos de su equipo
- Admins tienen acceso completo

### 3. Crear Usuarios Iniciales

Ejecuta estos comandos desde el backend o usando la API:

```bash
POST /make-server-15630662/auth/signup
{
  "email": "admin@crm.com",
  "password": "password123",
  "full_name": "Administrador",
  "role": "admin"
}
```

Repite para crear usuarios de prueba:
- `supervisor@crm.com` - rol: supervisor
- `agent@crm.com` - rol: agent

### 4. Configuración de Telefonía SIP (Opcional)

Para habilitar llamadas SIP reales, configura las siguientes variables de entorno:

```env
VITE_SIP_WEBSOCKET_URL=wss://tu-servidor-sip.com
VITE_SIP_DOMAIN=tu-dominio.com
VITE_STUN_SERVER=stun:stun.l.google.com:19302
```

**Proveedores SIP recomendados:**

#### Opción 1: Twilio (Más fácil)
- Crea cuenta en [Twilio](https://www.twilio.com)
- Obtén credenciales SIP
- Usa Twilio Client SDK

#### Opción 2: Asterisk/FreePBX (Self-hosted)
- Instala Asterisk con WebRTC
- Configura PJSIP con WebSocket
- Habilita STUN/TURN

#### Opción 3: VoIP.ms (Económico)
- Registra cuenta en VoIP.ms
- Configura SIP trunk
- Usa JsSIP para WebRTC

Ver `ARCHITECTURE.md` sección 7 para detalles de configuración por proveedor.

## 📱 Uso del Sistema

### Login
1. Accede a la aplicación
2. Usa credenciales de prueba o crea nuevos usuarios
3. El sistema te redirige al dashboard según tu rol

### Workflow Típico - Agente

1. **Ver leads asignados**
   - Navega a "Leads"
   - Filtra por estado (nuevos, a contactar, etc.)

2. **Realizar llamada**
   - Click en botón "LLAMAR" (icono de teléfono verde)
   - Se abre el softphone
   - La llamada se marca automáticamente
   - Registra notas durante la llamada

3. **Actualizar estado del lead**
   - Después de la llamada, actualiza el estado
   - Añade observaciones
   - Programa siguiente seguimiento

4. **Cerrar venta**
   - Si el lead acepta, navega a "Ventas"
   - Registra la venta con todos los datos
   - Sistema calcula comisiones automáticamente

5. **Ver comisiones**
   - Dashboard muestra comisiones del día/mes
   - Filtrado por periodo

### Workflow Típico - Supervisor

1. **Monitorizar agentes**
   - Dashboard muestra rendimiento en tiempo real
   - Gráficos de llamadas y ventas por agente

2. **Asignar/Reasignar leads**
   - Asigna leads nuevos a agentes
   - Redistribuye leads no contactados

3. **Validar ventas**
   - Revisa ventas pendientes
   - Valida o rechaza según políticas
   - Sistema actualiza comisiones automáticamente

4. **Escuchar grabaciones** (si configurado)
   - Accede al historial de llamadas
   - Descarga grabaciones para revisión

### Workflow Típico - Admin

1. **Crear campañas**
   - Define nueva campaña
   - Asocia aseguradora
   - Configura productos

2. **Gestionar usuarios**
   - Crear nuevos agentes/supervisores
   - Asignar permisos
   - Desactivar usuarios

3. **Reportes avanzados**
   - Analiza rendimiento global
   - ROI por campaña
   - Exporta datos para análisis

## 🔐 Seguridad

### Autenticación
- JWT tokens con expiración
- Refresh tokens automáticos
- HTTPS obligatorio en producción

### Autorización
- Row Level Security (RLS) en PostgreSQL
- Permisos verificados en backend
- Frontend valida permisos antes de renderizar

### Datos Sensibles
- Contraseñas hasheadas (bcrypt vía Supabase)
- Grabaciones con signed URLs
- SIP credentials nunca en frontend
- CORS configurado correctamente

## 📊 KPIs y Métricas

El sistema trackea automáticamente:

- **Llamadas**: Total, completadas, duración media
- **Conversión**: % de leads que se convierten en ventas
- **Productividad**: Llamadas/hora por agente
- **Ingresos**: Primas totales, comisiones
- **Tiempos**: Duración de llamadas, tiempo de seguimiento

## 🐛 Debugging

### Logs del Backend
Los logs se muestran en la consola de Supabase Edge Functions:
```bash
# Ver logs en tiempo real
supabase functions logs make-server-15630662
```

### Problemas Comunes

**Error: "Unauthorized"**
- Verifica que el token de sesión sea válido
- Comprueba que el usuario existe en `profiles`

**Error: "Failed to fetch leads"**
- Verifica políticas RLS en Supabase
- Comprueba que el usuario tenga rol asignado

**Softphone no conecta**
- Modo demo funciona sin configuración SIP
- Para llamadas reales, configura variables de entorno SIP
- Verifica firewall permite WSS (WebSocket Secure)

**Llamadas no se registran**
- Verifica que el lead_id sea válido
- Comprueba permisos INSERT en tabla `calls`

## 🚧 Próximas Funcionalidades

- [ ] Predictive dialer automático
- [ ] Integración WhatsApp/SMS
- [ ] App móvil (React Native)
- [ ] Webhooks para eventos
- [ ] Integración con ERPs externos
- [ ] Speech-to-text para transcripciones
- [ ] Sentiment analysis en llamadas
- [ ] Gamificación para agentes

## 📈 Escalabilidad

El sistema está preparado para escalar:

- **10-50 usuarios**: Configuración actual funciona perfectamente
- **50-200 usuarios**: Añadir índices adicionales en BD, cache con Redis
- **200+ usuarios**: Considerar particionamiento de tablas, múltiples instancias

Ver `ARCHITECTURE.md` sección 4 para detalles de escalabilidad.

## 🆘 Soporte

Para problemas técnicos:
1. Revisa los logs del backend
2. Verifica configuración de Supabase
3. Consulta `ARCHITECTURE.md` para detalles técnicos
4. Consulta `DATABASE_SCHEMA.md` para estructura de datos

## 📄 Licencia

Este es un proyecto profesional de producción. Úsalo según los términos de tu organización.

## 👨‍💻 Arquitectura Técnica

Para detalles completos de la arquitectura, flujos de datos, integración SIP, y configuración avanzada, consulta:

- `ARCHITECTURE.md` - Arquitectura completa del sistema
- `DATABASE_SCHEMA.md` - Schema de base de datos con ejemplos

---

**Desarrollado con ❤️ para call centers profesionales de seguros**
