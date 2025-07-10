# Arquitectura del Sistema

## Componentes Principales

### 1. BuilderBot (Core)
- Manejo de conexión WhatsApp
- Gestión de estados de conversación
- Enrutamiento de mensajes

### 2. Controladores
- `intentMapper`: Mapea mensajes a intenciones
- `ticketFlow`: Maneja flujos de tickets

### 3. Servicios
- `BotpressService`: Integración con Botpress
- `RedmineService`: Integración con Redmine

### 4. Gestión de Estado
```typescript
interface SessionData {
  estado: Record<string, string>
  contexto: Record<string, any>
  conversacionFinalizada: Record<string, boolean>
  paginaActual: Record<string, number>
}
```

## Flujo de Datos
1. Mensaje WhatsApp → BuilderBot
2. BuilderBot → IntentMapper
3. IntentMapper → Services
4. Services → External APIs
5. Response → BuilderBot → WhatsApp

## Diagrama de Secuencia
