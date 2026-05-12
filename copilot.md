# Auditoría del proyecto FoodSPV

Fecha: 2026-05-11
Autor: Copilot (resumen automatizado)

---

## Resumen ejecutivo
FoodSPV es una aplicación Next.js (App Router, TypeScript) multi-tenant que usa Firebase (Auth + Firestore) y Stripe para pagos. La UI pública (app/[tenant]) está completa con carrito y checkout; existen guardias de admin y lógica básica para ordenes. El proyecto está avanzado y funcional, pero requiere mejoras de seguridad, limpieza del repo, validación y hardening para producción.

---

## Arquitectura / tecnologías principales
- Next.js 16 (App Router)
- TypeScript (strict: true)
- Firebase JS SDK (v12) para Auth y Firestore (cliente)
- Reglas de Firestore (firestore.rules presentes)
- Stripe (Checkout + webhook)
- TailwindCSS
- Cliente guarda carrito en localStorage

---

## Estado actual (alto nivel)
- Funcionalidad pública: completada (páginas de tenant con fallback visual, carrito, checkout).
- Integración Stripe: presente (API route para crear sesión y webhook para guardar pedido).
- Autenticación: Auth client con listener + roles en colección `users`.
- Reglas Firestore: implementadas con funciones isSuperAdmin / isAdminOf.
- Contextos: AuthProvider y CartProvider implementados.

---

## Hallazgos importantes (detallados)
1. Repositorio contiene artefactos build (.next) comprometidos en la historia. Esto aumenta el tamaño del repo y puede filtrar metadatos.
2. Variables de entorno: hay `.env.production` detectado en el repo (posible exposición de secretos). Confirmar y eliminar si contiene claves.
3. Inicialización Firebase en `src/lib/firebase.ts` usa variables NEXT_PUBLIC_*, que están bien para config client-side (no secret), pero cualquier credencial sensible no debe estar en variables públicas.
4. Firestore rules permiten `create` de `/tenants/{tenantId}/orders` sin autenticación (allow create: if true). Diseño válido para checkout abierto, pero:
   - No hay validaciones estructurales en rules (tipo/longitud/valor mínimo), por lo que es vulnerable a spam/ordenes inválidas.
   - Recomendable añadir validación de campos y límites (max items, total razonable, estructura items).
5. Webhook Stripe: si `STRIPE_WEBHOOK_SECRET` no está definido, la verificación del webhook se omite (eventos aceptados sin firma). Esto es inseguro en producción.
6. Órdenes con pago "pickup" se crean directamente desde el cliente (addDoc) — funcional pero facilita spam y manipulación del cliente.
7. Guardias y roles son verificaciones client-side (SuperAdminGuard/ProtectedRoute). Las reglas Firestore deben ser la última línea de defensa (sí existen), pero revisar coherencia con UI.
8. No hay evidencia de CI/CD, tests automáticos ni lint/build paso en PRs.
9. Falta documentación operacional (deploy, variables env necesarias, cómo obtener claves Stripe/Firebase, pasos para revocar/rotar secretos).

---

## Riesgos y prioridades
Alta prioridad (corregir antes de producción):
- Eliminar archivos build de git y purgar historia (.next) + confirmar que no se subieron claves en `.env.production`.
- Habilitar verificación obligatoria del webhook Stripe en producción (no omitir si secret ausente).
- Añadir validación de datos y límites en firestore.rules para `orders`.

Mediana prioridad:
- Mover lógica crítica/validación al servidor (Cloud Function o server route) para crear pedidos verificados (por ejemplo validar total, precio unitario, prevenir manipulación de precios).
- Añadir rate-limiting / captcha para endpoints de creación de pedidos para mitigar spam.
- Implementar CI: lint, build y (si aplica) tests en GitHub Actions.

Baja prioridad / mejoras:
- Añadir tests (unitarios y e2e para flujo de checkout).
- Añadir monitoreo/alertas (Sentry, Logging, métricas de pagos).
- Mejorar README con pasos de despliegue y arquitectura.

---

## Recomendaciones técnicas (acciones concretas)
1. Seguridad y secretos
   - Eliminar `.env.*` del repo. Usar secret manager (Vercel/Netlify/GCP Secret Manager/GitHub Secrets).
   - Hacer que la verificación del webhook sea obligatoria en entornos `production`.
   - Revisar `src/lib/firebase.ts` para diferenciar config pública (NEXT_PUBLIC_*) vs operaciones admin (usar Firebase Admin SDK en server para tareas sensibles).

2. Firestore rules
   - Añadir validación de `request.resource.data` en orders: campos requeridos, tipos, longitudes, máximo items, total<=sum(items.unit*qty) o al menos un límite razonable.
   - Mantener `create` público si se necesita, pero validar estructura y añadir rate limits (si posible).

3. Servidor / Validación
   - Implementar un endpoint server-side (verificado) que recalcule precios y cree la orden en Firestore, en lugar de confiar en el cliente. Para pagos con Stripe, usar metadata y webhook para reconciliar.
   - Para "pago al recoger" (pickup), considerar envío de la orden primero a una cola validable o a una Cloud Function que aplique reglas y despues persista.

4. Repo hygiene
   - Quitar `.next` del repo y purgarlo de la historia (`git rm -r --cached .next` + git filter-repo/BFG si necesario).
   - Añadir `.env.production` a .gitignore y rotar credenciales comprometidas.

5. Developer DX
   - Añadir GitHub Actions: lint, build, typecheck y pruebas en PRs.
   - Añadir Dependabot updates y dependencias audit.
   - Documentar variables de entorno y pasos de despliegue en README.

6. Observabilidad
   - Instalar Sentry o similar y añadir logs útiles en APIs (checkout + webhook).
   - Guardar métricas de órdenes y fallos de pago.

---

## Lista priorizada de tareas (recomendadas)
1. Bloqueante: Revisar y eliminar credenciales expuestas; remover `.next` de git y purgar historia.
2. Forzar verificación del webhook Stripe en producción.
3. Añadir validaciones robustas en firestore.rules para `orders`.
4. Implementar endpoint server-side para validar y persistir órdenes (evitar confianza completa en el cliente).
5. Añadir CI (GitHub Actions) para checks en PRs.
6. Añadir tests básicos (typecheck + flujos críticos: carrito -> checkout -> webhook).
7. Añadir documentación de despliegue y operación en README y CONTRIBUTING.
8. Implementar protecciones anti-spam (rate limit o captcha) en la creación de pedidos.

---

## Sugerencias operativas y buenas prácticas
- Rotar claves si alguna estuvo en el repo. Mantener todas en gestores de secretos.
- Revisar reglas Firestore periódicamente y mantener pruebas de reglas (emulators + tests).
- Definir un plan de incidentes para pagos fallidos y reintentos de webhook.
- Evitar lógica crítica en el cliente; usar servidor como fuente de verdad para asuntos monetarios.

---

## Próximos pasos propuestos (si desean que implemente)
- 1) Hacer limpieza del repo (.next, .env) y asegurar secretos — puedo preparar los comandos y PR.
- 2) Forzar verificación de webhook y mejorar reglas Firestore — puedo proponer cambios de reglas y tests.
- 3) Implementar endpoint server-side para crear órdenes (Cloud Function/Next API route con verificación) — puedo implementarlo y añadir pruebas básicas.

---

## Archivos revisados (muestra)
- package.json
- next.config.js
- tsconfig.json
- app/[tenant]/page.tsx
- app/layout.tsx
- app/api/checkout/route.ts
- app/api/webhook/stripe/route.ts
- src/lib/firebase.ts
- context/AuthContext.tsx
- context/CartContext.tsx
- components/CartModal.tsx
- firestore.rules

---

Si desea, se procede con los cambios en el repo en el orden priorizado (limpieza -> seguridad webhook -> reglas -> servidor). Indique si comenzar por la limpieza del repo (quitar .next y revisar .env.production) o por reforzar la verificación del webhook y las reglas Firestore.


---

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
