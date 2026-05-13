# Auditoria FoodSPV

Fecha: 2026-05-13

## Estado general

FoodSPV esta en estado de MVP avanzado. La app web compila, la experiencia principal ya existe, pero el backend de confianza, la coherencia del modelo de datos y la estrategia de despliegue todavia no estan cerrados.

Conclusion corta:

- La interfaz esta bastante adelantada.
- La logica critica de pedidos y pagos aun no esta lista para produccion.
- `functions/` si fue revisado y hoy esta en estado parcial / no integrado del todo.

## Verificaciones realizadas

- `npm run build`: pasa en la raiz.
- `./node_modules/.bin/eslint .`: falla con 50 problemas.
- `npm --prefix functions run build`: falla localmente porque no existe `functions/node_modules` en este workspace.

## Hallazgos principales

### 1. El flujo de pedidos no esta unificado

Hay tres contratos distintos para `orders`:

- Reglas Firestore en `firestore.rules`
- Pickup desde cliente en `src/components/CartModal.tsx`
- Webhook Stripe en `app/api/webhook/stripe/route.ts`

Hoy no escriben exactamente los mismos campos ni usan la misma estrategia de validacion.

Impacto:

- Riesgo de fallos al desplegar reglas reales.
- Riesgo de reportes, paneles y notificaciones con datos inconsistentes.

### 2. Los precios aun dependen del cliente

`app/api/checkout/route.ts` crea la sesion Stripe usando `precio` enviado por el navegador. El flujo pickup tambien confia en el total del cliente.

Impacto:

- Un usuario podria manipular precios o totales.
- El servidor todavia no es la fuente de verdad monetaria.

### 3. Roles inconsistentes

El login admite `tenant_admin`, pero guards y reglas no usan el mismo contrato.

Impacto:

- Usuarios que pueden iniciar sesion pero no operar correctamente.
- Autorizacion impredecible segun la pantalla.

### 4. Tenants con schema inconsistente

Superadmin crea `name`, mientras la vista publica consume `nombre`.

Impacto:

- El tenant real puede existir y aun asi la vista caer en datos demo.

### 5. Estrategia de despliegue sin cerrar

Conviven:

- App Hosting (`apphosting.yaml`)
- Route Handlers en Next
- `nextApp` dentro de Firebase Functions

Impacto:

- Complejidad operativa innecesaria.
- Riesgo de mantener dos arquitecturas a la vez.

## Revision especifica de `functions/`

### Estado actual de `functions/`

Directorio revisado:

- `functions/src/index.ts`
- `functions/package.json`
- `functions/tsconfig.json`
- `functions/.eslintrc.js`

Resultado:

- Hay una intencion clara de usar Functions Gen2.
- La carpeta no esta lista como pieza final de produccion.
- Parece una mezcla entre experimento util y backend futuro, pero todavia no esta consolidada.

### Que hacen hoy las Functions

`functions/src/index.ts` define dos piezas:

1. `nextApp`
   Monta una app Next dentro de Functions con `onRequest`.

2. `notifyOrder`
   Escucha nuevas ordenes en `tenants/{tenantId}/orders/{orderId}` y manda WhatsApp.

### Problemas encontrados en `functions/`

#### A. Build local no operativo

`npm --prefix functions run build` fallo porque en este repo no existe `functions/node_modules`.

Eso significa que, al menos en este workspace, la parte de Functions no esta preparada para compilarse localmente sin instalar dependencias.

#### B. `nextApp` dentro de Functions compite con App Hosting

En `functions/src/index.ts` existe una app Next SSR embebida dentro de Functions, pero el repo tambien tiene `apphosting.yaml`.

Lectura tecnica:

- O se despliega Next con App Hosting
- O se envuelve Next dentro de Functions / Cloud Run

Mantener ambas rutas a la vez no aporta claridad.

#### C. `notifyOrder` consume un schema que no coincide con las ordenes reales

La Function lee:

```ts
pedido.cliente?.nombre
pedido.cliente?.telefono
```

Pero las ordenes actuales guardan campos como:

- `nombreCliente`
- `telefonoCliente`

Consecuencia:

- Las notificaciones saldrian incompletas o con `N/A`.

#### D. `notifyOrder` asume estructura monetaria no garantizada

La Function arma el mensaje usando:

```ts
i.precio * i.cantidad
pedido.total.toFixed(2)
```

Eso depende de que el documento llegue con forma exacta y valida, algo que hoy el sistema no garantiza del todo.

#### E. `functions/package.json` trae `next` como dependencia

Eso tiene sentido solo si realmente quieres servir Next desde Functions. Si la decision final es App Hosting, esa dependencia y la funcion `nextApp` sobran.

#### F. La responsabilidad de Functions no esta acotada

Hoy `functions/` intenta ser al mismo tiempo:

- runtime SSR de Next
- disparador de eventos
- integracion de WhatsApp

Mi recomendacion es dejar Functions solo para trabajo asincrono o integraciones externas, no para servir toda la app si ya usaras App Hosting.

## Mi lectura del estado de `functions/`

No estan abandonadas, pero tampoco estan cerradas.

Estado que les asigno:

- Tecnica: prototipo funcional parcial
- Operativa: no lista para despliegue confiable
- Arquitectura: pendiente de decision

## Propuestas ordenadas por importancia

### P0 - Lo primero que haria

1. Definir arquitectura final de despliegue.
   Recomendacion: Next 16 en Firebase App Hosting y Functions solo para tareas asincronas.

2. Unificar el schema de `orders`.
   Todos los caminos deben escribir exactamente el mismo contrato.

3. Mover la creacion valida de pedidos al servidor.
   Pickup y Stripe deben recalcular precios desde Firestore y no confiar en el cliente.

4. Reescribir `firestore.rules` segun el schema real.

5. Corregir `notifyOrder` para consumir el schema correcto o pausarla hasta cerrar el contrato.

### P1 - Despues de eso

1. Arreglar `lint` para Next 16.
2. Eliminar la ruta demo vieja `app/menu/[slug]/page.tsx` o migrarla.
3. Alinear home, QR y tenant pages a una sola ruta publica.
4. Corregir roles y guards.
5. Documentar deploy, secretos y flujo operativo real.

### P2 - Para dejarlo fuerte

1. CI con build + eslint.
2. Tests del flujo de pedido.
3. Observabilidad de pagos y webhooks.
4. Notificaciones y tracking de pedido.

## Recomendacion final de arquitectura

Yo seguiria este camino:

- Next.js 16 App Router como frontend y backend ligero con Route Handlers.
- Firebase App Hosting como despliegue principal.
- Firebase Admin SDK en servidor para operaciones sensibles.
- Firebase Functions solo para eventos asincronos:
  - WhatsApp
  - reintentos
  - procesos offline

No mantendria `nextApp` dentro de Functions salvo que decidas abandonar App Hosting.

## Donde ver el resultado

Archivos creados / utiles:

- Memoria operativa y roadmap vivo: `codex.md`
- Reporte de auditoria completo: `auditoria-foodspv.md`

## Siguiente paso recomendado

Si quieres, el siguiente trabajo util no es seguir auditando: es cerrar el P0.

Mi orden exacto seria:

1. decidir arquitectura final
2. definir schema canonico
3. reescribir flujo seguro de pedidos
4. alinear reglas, webhook y functions
