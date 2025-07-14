
# Documentación de APIs

## 🎯 Redmine API

### Endpoints Utilizados

#### Crear Ticket
**POST** `/issues.json`
```json
{
  "issue": {
    "project_id": 33,
    "tracker_id": 26,
    "status_id": 1,
    "priority_id": 2,
    "subject": "Categoría: Asunto",
    "description": "Descripción del ticket",
    "assigned_to_id": 123,
    "custom_fields": [
      { "id": 7, "value": "Oficina" },
      { "id": 4, "value": "Nombre Empleado" },
      { "id": 30, "value": "Número de WhatsApp" }
    ]
  }
}
```
**Respuesta exitosa:**
```json
{
  "issue": {
    "id": 1234,
    ...
  }
}
```

#### Consultar Ticket
**GET** `/issues/{id}.json`
**Respuesta:**
```json
{
  "issue": {
    "id": 1234,
    "subject": "...",
    "status": { "id": 1, "name": "Nuevo" },
    ...
  }
}
```

#### Cancelar Ticket
**PUT** `/issues/{id}.json`
```json
{
  "issue": {
    "status_id": 6,
    "notes": "🚫 Ticket rechazado vía T-BOT WhatsApp",
    "private_notes": true
  }
}
```
**Respuesta:**
```json
{
  "success": true,
  "ticketId": 1234,
  "message": "✅ Ticket rechazado exitosamente"
}
```

#### Listar Tickets (paginado)
**GET** `/issues.json?project_id=soporte-tecnico-mpf&limit=5&offset=0&status_name=Nueva&contact_id=123`
**Respuesta:**
```json
{
  "issues": [ ... ],
  "total_count": 12
}
```

#### Guardar Calificación
**PUT** `/issues/{id}.json`
```json
{
  "issue": {
    "notes": "📊 Calificación del servicio: Excelente 🌟",
    "private_notes": true
  }
}
```

#### Buscar Contacto por Teléfono
**GET** `/contacts.json?project_id=33&include=custom_fields`

---

## 🤖 Botpress API

### Endpoints

#### Enviar Mensaje
**POST** `/api/v1/bots/{botId}/converse/{userId}`
```json
{
  "type": "text",
  "text": "Mensaje del usuario"
}
```
**Respuesta:**
```json
{
  "responses": [
    { "type": "text", "text": "Respuesta del bot" }
  ],
  "context": { ... }
}
```

---

## 💬 BuilderBot Events

### Eventos Principales

#### Mensaje Entrante
```typescript
adapterProvider.on('message', async (ctx) => {
  // Manejo de mensaje entrante de WhatsApp
})
```

#### Envío de Mensaje
```typescript
adapterProvider.sendMessage(number, message, options)
```

---

## Edge Cases y Notas
- Todos los endpoints requieren autenticación por API Key.
- Los IDs de proyecto, usuario y campos personalizados pueden variar según la instancia.
- El bot maneja paginación y filtrado de tickets por estado y contacto.
- Las respuestas de error incluyen mensajes descriptivos y códigos HTTP estándar.

## Ejemplo de Error
```json
{
  "success": false,
  "message": "No se encontró el ticket #1234"
}
```
