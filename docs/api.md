# Documentación de APIs

## 🎯 Redmine API

### Endpoints Utilizados

#### Crear Ticket
```typescript
POST /issues.json
{
  "issue": {
    "project_id": number,
    "subject": string,
    "description": string,
    "assigned_to_id": number,
    // ...otros campos
  }
}
```

#### Consultar Ticket
```typescript
GET /issues/{id}.json
```

#### Eliminar Ticket
```typescript
DELETE /issues/{id}.json
```

## 🤖 Botpress API

### Endpoints

#### Enviar Mensaje
```typescript
POST /api/v1/bots/{botId}/converse/{userId}
{
  "type": "text",
  "text": string
}
```

## 💬 BuilderBot Events

### Eventos Principales

#### Mensaje Entrante
```typescript
adapterProvider.on('message', async (ctx) => {
  // Manejo de mensaje
})
```

#### Envío de Mensaje
```typescript
adapterProvider.sendMessage(number, message, options)
```
