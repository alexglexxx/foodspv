# Proyecto FoodSPV - Guía de Contexto y Estándares

Este archivo sirve como memoria central para Gemini CLI sobre la arquitectura, el estado y las reglas del proyecto.

## 🎯 Objetivo del Proyecto
Plataforma SaaS multi-tenant para gestión de pedidos y menús, utilizando Next.js y Firebase.

## 🏗️ Arquitectura y Tecnologías
- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS (Vanilla CSS preferido para componentes personalizados)
- **Backend/Base de Datos:** Firebase (Firestore, Auth, Functions, App Hosting)
- **Estructura de Rutas:**
  - `/[tenant]`: Interfaz pública/cliente para cada restaurante.
  - `/admin`: Panel de control para el dueño del restaurante.
  - `/superadmin`: Panel global para administración de la plataforma.

## 🛠️ Estado Actual (Mayo 2026)
- [x] Configuración inicial de Firebase.
- [x] Sistema de autenticación con Context API.
- [x] Estructura de rutas multi-tenant.
- [x] Implementación de la vista pública del cliente (`app/[tenant]/page.tsx`) con diseño oscuro premium (tipo Uber Eats) y sistema de fallback/mock de datos.
- [x] Refactorización de archivos temporales y centralización de credenciales de Firebase en `lib/firebase.ts`.
- [x] Lógica funcional del carrito de compras (Context API).
- [x] Guardado de pedidos en Firestore (Flujo de confirmación mediante Modal).
- [ ] Optimización de reglas de seguridad de Firestore.

## 📋 Reglas y Convenciones (Mandatos)
1. **Seguridad:** Nunca exponer llaves de Firebase en el cliente de forma insegura. Las reglas de Firestore DEBEN validar el `tenantId`.
2. **Nomenclatura:** Usar PascalCase para componentes y camelCase para funciones/variables.
3. **Multi-tenancy:** Toda consulta a Firestore debe estar filtrada por el contexto del tenant actual.
4. **Limpieza:** Antes de finalizar una tarea, eliminar archivos de prueba (`prueba.txt`, etc.).

## 🚀 Próximos Pasos Sugeridos
1. **Lógica del Carrito:** Implementar el estado global (Context/Zustand) para el carrito de compras y conectar el botón "+" de `app/[tenant]/page.tsx`. (Completado)
2. **Flujo de Pedidos:** Crear la función para que al presionar "Ver pedido" / "Confirmar", se guarde el documento en la colección `tenants/{id}/orders`. (Completado con validaciones estrictas y diseño Fintech Dark Mode)
3. **Limpieza de Deuda Técnica:** Eliminar archivos basura (`prueba.txt`, `estructura.txt`, `layout.ysx`), consolidar `lib/firebase.ts` (eliminando redundancias) y usar variables de entorno. (Completado)
4. **Protección de Rutas:** Estandarizar el uso de `SuperAdminGuard` y `ProtectedRoute`. (Completado)
5. **Seguridad Firestore:** Implementar `firestore.rules` para modelo SaaS multi-tenant. (Completado)
