# Codex Memory - FoodSPV

Ultima auditoria: 2026-05-13
Ultima actualizacion de implementacion: 2026-05-13

## Resumen

FoodSPV es un SaaS multi-tenant para restaurantes. La app web en Next.js ya tiene una base funcional visible: menu publico por tenant, carrito, checkout, panel admin y panel superadmin. El proyecto no esta terminado ni listo para produccion: la interfaz va bastante adelantada, pero la verdad del backend, la seguridad de pedidos, la coherencia del esquema y el modelo de despliegue siguen abiertos.

Estado corto: MVP avanzado / pre-produccion temprana.

## Estado verificado

- Web app: `npm run build` pasa en Next 16.
- Script de lint raiz: roto. `package.json` usa `next lint`, pero Next 16 lo elimino.
- ESLint manual (`./node_modules/.bin/eslint .`): falla con 50 problemas (29 errores, 21 warnings).
- Firebase Functions local: `npm --prefix functions run build` falla en el entorno actual porque `functions/node_modules` no esta instalado localmente.
- README y documentacion principal: desactualizados.

## Lo que ya existe

- Ruta publica multi-tenant en `app/[tenant]/page.tsx`.
- Carrito persistido en `localStorage`.
- Modal de pedido publico con nombre y telefono.
- Panel admin con lista de pedidos en tiempo real y QR.
- Panel superadmin para crear tenants y menu.
- Route handler para webhook general de WhatsApp/Meta.
- Reglas iniciales de Firestore.
- Cloud Function de notificacion por WhatsApp alineada al pedido publico.

## Diagnostico

La app ya tiene forma de producto, pero todavia no tiene cerrada la capa de confianza.

Problemas estructurales actuales:

- El esquema de datos no esta unificado.
- Los pedidos dependen demasiado del cliente.
- Las reglas de Firestore no coinciden con lo que escriben la UI ni los webhooks.
- Hay dos modelos de despliegue conviviendo sin decision final: App Hosting y Next dentro de Functions.
- El control de calidad no esta cerrado para Next 16.

## Bloqueadores reales

- [ ] Unificar esquema de `tenant`, `user` y `order`.
- [ ] Decidir si el pedido publico se queda en Firestore directo o pasa a endpoint server-side.
- [ ] Endurecer validacion anti-spam para pedidos publicos.
- [ ] Alinear roles (`superadmin`, `admin`, etc.) entre login, guards y reglas.
- [ ] Elegir un solo modelo de despliegue.
- [ ] Arreglar pipeline de lint y bajar los errores actuales.

## Esquema canonico sugerido

### Tenant

```ts
{
  name: string
  slug: string
  description?: string
  bannerUrl?: string
  notifyPhone?: string
  active: boolean
  ownerId?: string
  createdAt: Timestamp
}
```

### User

```ts
{
  email: string
  role: "superadmin" | "admin"
  tenantId?: string
  createdAt?: Timestamp
}
```

### Order

```ts
{
  tenantId: string
  customerName: string
  customerPhone: string
  items: Array<{
    id: string
    name: string
    unitPrice: number
    quantity: number
  }>
  total: number
  status: "new" | "preparing" | "delivered" | "cancelled"
  paymentMethod: "pickup" | "stripe"
  paymentStatus?: "pending" | "paid" | "failed"
  source: "web"
  createdAt: Timestamp
}
```

## Roadmap recomendado

### P0 - Cerrar lo que hoy rompe el producto

1. Normalizar nombres de campos y roles en toda la app.
2. Reescribir `firestore.rules` segun el esquema real.
3. Corregir login/guards para que no existan roles que la app luego bloquea.
4. Decidir si el siguiente paso del flujo publico es mantener escritura directa o pasar a endpoint.
5. Cerrar el deploy final de Next y Functions.

### P1 - Cerrar el producto usable

1. Alinear el schema de tenant entre vista publica y superadmin.
2. Cerrar despliegue, secretos, reglas e indexes.
3. Renombrar `middleware.ts` a `proxy.ts` y limpiar warnings de Next 16.
4. Agregar proteccion basica contra pedidos basura.
5. Definir si el panel admin queda como apoyo o se minimiza aun mas.

### P2 - Subir nivel de entrega

1. Agregar CI con build, eslint y type checks.
2. Agregar pruebas del flujo critico de pedido.
3. Mejorar observabilidad de pagos y webhooks.
4. Pulir UX de estados vacios, errores y tenants inexistentes.

## Decision tecnica recomendada

Mantener una sola arquitectura:

- Frontend y route handlers en Next.js 16.
- Hosting en Firebase App Hosting.
- Firebase Admin SDK solo en servidor para operaciones sensibles.
- Cloud Functions solo si realmente aportan valor claro (por ejemplo notificaciones async).

No conviene mantener al mismo tiempo App Hosting y un `nextApp` dentro de `functions/src/index.ts` salvo que exista una razon operativa muy concreta.

## Checklist vivo

- [x] Auditoria inicial del repo
- [x] Verificacion de build web
- [x] Verificacion del estado de lint
- [x] Verificacion del estado de functions
- [x] Stripe removido del flujo publico
- [x] Modal de pedido simplificado a nombre + telefono
- [x] Ruta publica vieja `app/menu/[slug]` removida
- [x] Function de WhatsApp alineada al pedido actual
- [ ] Esquema de datos unificado
- [ ] Flujo endurecido de pedidos publicos
- [ ] Reglas Firestore alineadas al modelo real
- [ ] Roles alineados entre auth, UI y reglas
- [ ] Deploy path definido
- [ ] CI minimo configurado
- [ ] Documentacion real de operacion y deploy

## Preguntas abiertas

- El cliente final va a ser anonimo o autenticado?
- El producto final es solo pickup o tambien delivery?
- WhatsApp se usara solo para notificaciones o tambien para ordenar?
- Se quiere App Hosting como destino final o se prefiere Functions/Cloud Run custom?

## Reglas de trabajo para futuras sesiones

- Antes de tocar codigo Next.js, leer la guia relevante en `node_modules/next/dist/docs/` por la version actual.
- No agregar mas escrituras criticas a Firestore desde cliente para pedidos o pagos.
- Tratar precios, estados y roles como verdad de servidor.
- Actualizar este archivo cada vez que se cierre una tarea importante.
