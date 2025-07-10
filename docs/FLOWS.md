# Documentación de Flujos Conversacionales

## Flujos Principales

### 1. Generación de Ticket
1. **Inicio**
   - Trigger: Usuario envía "generar" o "1"
   - Estado: `nodo_saludo` → `esperando_categoria`

2. **Selección de Categoría**
   - Muestra: Lista de categorías disponibles
   - Estados posibles: `subcat_*`
   - Validaciones: Opción válida

3. **Selección de Subcategoría**
   - Muestra: Lista específica de la categoría
   - Validaciones: Opción válida
   - Acciones: Prepara datos del ticket

4. **Confirmación**
   - Muestra: Resumen del ticket
   - Estados: `nodo_confirmar_envio`
   - Acciones: Crea ticket en Redmine

### 2. Consulta de Ticket
1. **Inicio**
   - Trigger: "consultar" o "2"
   - Estado: `esperando_id_consulta`

2. **Proceso**
   - Validación: Número válido
   - Consulta: Redmine API
   - Respuesta: Detalles formateados

### 3. Cancelación de Ticket
1. **Inicio**
   - Trigger: "cancelar" o "3"
   - Estado: `esperando_id_cancelar`

2. **Proceso**
   - Validación: Número + Permisos
   - Acción: Cambio estado en Redmine
   - Confirmación: Mensaje al usuario

## Estados de Sesión

```typescript
interface EstadosSesion {
  nodo_saludo: 'Menú principal'
  esperando_categoria: 'Selección categoría'
  subcat_impresora: 'Subcategorías impresora'
  subcat_pc: 'Subcategorías PC'
  subcat_telefonoip: 'Subcategorías teléfono'
  subcat_camara: 'Subcategorías cámara'
  subcat_audiencia: 'Subcategorías audiencia'
  nodo_confirmar_envio: 'Confirmación final'
  esperando_id_consulta: 'Esperando número consulta'
  esperando_id_cancelar: 'Esperando número cancelar'
}
```

## Mensajes del Sistema

### Mensajes de Éxito
```typescript
const mensajesExito = {
  ticketCreado: '✅ Ticket creado con éxito...',
  ticketCancelado: '✅ Ticket cancelado exitosamente...',
  consultaExitosa: '📋 Detalles del ticket...'
}
```

### Mensajes de Error
```typescript
const mensajesError = {
  numeroInvalido: '⚠️ Número de ticket inválido...',
  ticketNoEncontrado: '⚠️ No se encontró el ticket...',
  errorSistema: '❌ Error en el sistema...'
}
```
