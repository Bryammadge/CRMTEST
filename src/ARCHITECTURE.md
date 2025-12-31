# Arquitectura del Sistema CRM Call Center

## 1. Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/TS)                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Dashboard│  │   Leads   │  │ Campaigns│  │   Sales    │ │
│  └──────────┘  └───────────┘  └──────────┘  └────────────┘ │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              JsSIP SoftPhone Component               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE BACKEND                                │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Auth + RLS    │  │ PostgreSQL   │  │ Edge Functions  │ │
│  │  (Roles/Perms) │  │   Database   │  │  (Hono Server)  │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│  ┌────────────────┐  ┌──────────────┐                      │
│  │   Realtime     │  │   Storage    │                      │
│  │ (Subscriptions)│  │ (Recordings) │                      │
│  └────────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ WebSocket (WSS)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              TELEFONÍA SIP                                   │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  SIP Proxy     │  │   Asterisk   │  │    FreePBX      │ │
│  │  (WebRTC GW)   │──│      PBX     │──│   (opcional)    │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
               ┌───────────┐
               │   PSTN    │
               │ (Telefonía│
               │  Pública) │
               └───────────┘
```

## 2. Capas de la Aplicación

### 2.1 Frontend Layer

**Tecnologías:**
- React 18 + TypeScript
- Tailwind CSS para UI
- Recharts para gráficos
- JsSIP para WebRTC/SIP
- Supabase Client para autenticación y realtime

**Módulos principales:**
```
/components
  /auth          - Login, SignUp, ProtectedRoute
  /dashboard     - Dashboards por rol
  /leads         - Gestión de leads, tabla, detalles
  /campaigns     - CRUD de campañas
  /products      - CRUD de productos
  /sales         - Gestión de ventas y pólizas
  /calls         - Historial de llamadas
  /users         - Gestión de usuarios (admin)
  /reports       - Reportes y analytics
  /sip           - SoftPhone component
  /common        - Componentes reutilizables
```

### 2.2 Backend Layer (Supabase Edge Functions)

**Endpoints principales:**

```typescript
// /supabase/functions/server/index.tsx

// Authentication
POST   /make-server-15630662/auth/signup
POST   /make-server-15630662/auth/login

// Leads
GET    /make-server-15630662/leads
POST   /make-server-15630662/leads
PUT    /make-server-15630662/leads/:id
DELETE /make-server-15630662/leads/:id
POST   /make-server-15630662/leads/:id/assign
GET    /make-server-15630662/leads/:id/history

// Campaigns
GET    /make-server-15630662/campaigns
POST   /make-server-15630662/campaigns
PUT    /make-server-15630662/campaigns/:id
DELETE /make-server-15630662/campaigns/:id

// Products
GET    /make-server-15630662/products
POST   /make-server-15630662/products
PUT    /make-server-15630662/products/:id

// Calls
POST   /make-server-15630662/calls/start
PUT    /make-server-15630662/calls/:id/end
GET    /make-server-15630662/calls
GET    /make-server-15630662/calls/:id/recording

// Sales
POST   /make-server-15630662/sales
PUT    /make-server-15630662/sales/:id/validate
GET    /make-server-15630662/sales

// Reports
GET    /make-server-15630662/reports/agent-performance
GET    /make-server-15630662/reports/campaign-stats
GET    /make-server-15630662/reports/daily-summary
POST   /make-server-15630662/reports/export

// Permissions
GET    /make-server-15630662/permissions/check
```

### 2.3 Database Layer

**PostgreSQL con Supabase**
- Ver `DATABASE_SCHEMA.md` para detalles completos
- Row Level Security (RLS) para seguridad por rol
- Triggers para auditoría automática
- Vistas materializadas para reporting

### 2.4 Telefonía SIP Layer

**Arquitectura de integración:**

```
Web Browser (JsSIP)
    ↓
WebSocket Secure (WSS)
    ↓
SIP WebRTC Gateway (ej: Kamailio, rtpengine)
    ↓
PBX (Asterisk/FreePBX)
    ↓
SIP Trunk Provider → PSTN
```

**Flujo de llamada outbound:**

1. Agente click en "LLAMAR" en lead
2. Frontend JsSIP inicia sesión SIP
3. JsSIP envía INVITE al SIP proxy
4. PBX enruta la llamada
5. Evento "calling" → Frontend actualiza UI
6. Evento "confirmed" → Llamada conectada
7. Backend registra inicio de llamada en DB
8. Durante llamada: Timer en UI
9. Evento "ended" → Calcular duración
10. Backend actualiza registro de llamada
11. Lead history se actualiza automáticamente

**Configuración SIP necesaria (por proveedor):**

```javascript
// Ejemplo configuración JsSIP
const configuration = {
  sockets: [new JsSIP.WebSocketInterface('wss://sip.proveedor.com')],
  uri: 'sip:agente123@dominio.com',
  password: 'password_sip',
  register: true,
  session_timers: false
};
```

## 3. Seguridad

### 3.1 Autenticación
- Supabase Auth con JWT
- Tokens con expiración
- Refresh tokens automáticos
- Social login opcional (Google, etc.)

### 3.2 Autorización
- Row Level Security en PostgreSQL
- Tabla `permissions` configurable
- Middleware en Edge Functions para verificar permisos
- Frontend valida permisos antes de renderizar componentes

### 3.3 Datos Sensibles
- Conexiones HTTPS/WSS obligatorias
- Encriptación en tránsito y reposo
- SIP credentials almacenadas de forma segura
- Grabaciones en Supabase Storage con signed URLs

### 3.4 Auditoría
- Tabla `lead_history` con todos los cambios
- Logs de llamadas completos
- Tracking de ventas y validaciones

## 4. Escalabilidad

### 4.1 Base de Datos
- Índices en columnas críticas (agent_id, campaign_id, status)
- Particionamiento por fecha para tabla `calls` (si >1M registros)
- Vacuum y analyze automáticos
- Connection pooling con PgBouncer

### 4.2 Backend
- Edge Functions serverless (escala automático)
- Caché con Redis para sesiones SIP activas
- Rate limiting por usuario

### 4.3 Frontend
- Lazy loading de componentes
- Virtualización de tablas grandes
- Caché local de configuración
- Service Worker para offline básico

## 5. Monitoreo y Observabilidad

### 5.1 Métricas clave
- Llamadas/hora por agente
- Tasa de conversión
- Duración promedio de llamadas
- Disponibilidad del sistema SIP
- Latencia de API

### 5.2 Alertas
- Caída de SIP server
- Errores de autenticación
- Fallas en grabación
- Picos de carga

## 6. Despliegue

### 6.1 Entornos
- **Development**: Localhost + Supabase local
- **Staging**: Vercel/Netlify + Supabase staging
- **Production**: CDN + Supabase production

### 6.2 CI/CD
- GitHub Actions
- Tests automatizados
- Migraciones de DB versionadas
- Rollback automático

## 7. Configuración SIP por Proveedor

### 7.1 Requisitos del proveedor SIP
- Soporte WebRTC (WSS)
- STUN/TURN servers
- Codec: G.711, Opus
- Grabación de llamadas
- API para provisioning

### 7.2 Proveedores recomendados
- **Twilio** (más fácil, API completa)
- **VoIP.ms** (económico, flexible)
- **Asterisk** (self-hosted, control total)
- **3CX** (solución empresarial)

### 7.3 Configuración en CRM
```typescript
// Almacenar en variables de entorno
VITE_SIP_WEBSOCKET_URL=wss://sip.provider.com
VITE_SIP_DOMAIN=domain.com
VITE_STUN_SERVER=stun:stun.l.google.com:19302
```

## 8. Limitaciones y Consideraciones

### 8.1 WebRTC/SIP
- Requiere HTTPS en producción
- Firewall debe permitir WSS, UDP para RTP
- Algunos browsers necesitan permisos de micrófono
- NAT traversal con STUN/TURN

### 8.2 Grabaciones
- Almacenamiento costoso para miles de llamadas
- Política de retención (ej: 90 días)
- Compresión Opus recomendada

### 8.3 Regulaciones
- GDPR/LOPD para datos personales
- Consentimiento para grabación
- Política de privacidad clara

## 9. Roadmap de Implementación

### Fase 1 (MVP - 2 semanas)
- [ ] Auth + roles
- [ ] CRUD leads
- [ ] CRUD campaigns/products
- [ ] Softphone básico (click-to-call)
- [ ] Dashboard básico

### Fase 2 (Producción - 3 semanas)
- [ ] Registro automático de llamadas
- [ ] Sistema de ventas completo
- [ ] Reportes avanzados
- [ ] Grabación de llamadas
- [ ] Permisos configurables

### Fase 3 (Optimización - 2 semanas)
- [ ] Predictive dialer
- [ ] Integración con CRMs externos
- [ ] App móvil (React Native)
- [ ] Webhooks para eventos

## 10. Costos estimados (mensual)

**Infraestructura:**
- Supabase Pro: $25/mes
- SIP Provider (Twilio): ~$1/usuario + $0.01/min
- Storage (grabaciones): $0.021/GB
- CDN/Hosting: $0-10/mes

**Total estimado para 10 agentes:**
- $50-100/mes + costo de minutos
