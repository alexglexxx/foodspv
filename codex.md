# Codex - Memoria y Auditoría del Proyecto FoodSPV

Ultima auditoria: 2026-05-13
Ultima actualizacion de implementacion: 2026-05-13 10:13 UTC

## 🎯 Visión General
FoodSPV es una plataforma SaaS (Software as a Service) multi-tenant diseñada para restaurantes. Permite a los negocios tener un menú digital público con carrito de compras y un panel de administración en tiempo real para gestionar los pedidos entrantes.

## 🏗️ Arquitectura y Tecnologías
*   **Frontend:** Next.js 14+ (App Router), React 19.
*   **Estilos:** Tailwind CSS v4, Lucide React (iconos), Diseño enfocado en Dark Mode premium.
*   **Backend & DB:** Firebase (Firestore, Auth, App Hosting).
*   **Estado Local:** Context API (`CartContext`, `AuthContext`).

## 📊 Auditoría y Estado Actual (Mayo 2026)
Tras analizar el código fuente, la estructura y las reglas de seguridad, el estado del proyecto es **muy avanzado en su núcleo (Core)**, pero faltan módulos de gestión y autoadministración.

### ✅ Lo que ya está terminado y funcional:
1.  **Multi-tenancy Básico:** La estructura de rutas `/[tenant]` permite a cada restaurante tener su propia URL.
2.  **Vista Pública (Menú):** La página pública lee los datos de Firebase y muestra un diseño pulido. Tiene un sistema de fallback (datos falsos) si el menú está vacío.
3.  **Lógica del Carrito:** Implementada correctamente usando Context.
4.  **Creación de Pedidos:** El componente `CartModal` permite a usuarios anónimos hacer pedidos con validación de nombre y teléfono. Los pedidos se guardan en la subcolección `orders` del tenant.
5.  **Panel de Control Admin (`/admin`):** Escucha en tiempo real los pedidos entrantes, muestra estadísticas financieras, permite cambiar los estados del pedido (Nuevo -> Cocinando -> Entregado) e incluye generación de Códigos QR para el restaurante.
6.  **Reglas de Seguridad (Firestore):** Altamente seguras. Usan validación estricta de esquemas (schema validation) para los pedidos públicos y validación de roles (`isAdminOf`, `isSuperAdmin`) para proteger los datos.

### ⚠️ Lo que falta (Deuda Técnica y Funcional):
*   El **Admin** no puede editar su menú ni la información de su restaurante desde la interfaz (actualmente requiere hacerlo manualmente en Firestore).
*   El **Superadmin** no tiene un panel completo para dar de alta nuevos restaurantes o asignar dueños.
*   Falta notificaciones sonoras o push para cuando el Admin recibe un nuevo pedido.

---

## 🚀 Hoja de Ruta: Próximos Pasos (En orden de importancia)

1.  **Gestión de Menú (Admin):** Crear la interfaz dentro del `/admin` (o en una pestaña nueva) para que el dueño del restaurante pueda agregar, editar y eliminar platillos (`productos` en la subcolección `menu`), y asignar categorías y fotos.
2.  **Configuración del Restaurante (Admin):** Permitir al dueño cambiar el nombre, descripción, banner y teléfono de su restaurante.
3.  **Panel de SuperAdmin (Gestión SaaS):** Terminar el dashboard en `/superadmin` para crear nuevos `tenants` (restaurantes) y crear usuarios con rol `admin` asignados a esos `tenants`.
4.  **Notificaciones Real-time:** Agregar una alerta sonora (un pequeño "ding") en la vista `/admin` cuando ingrese un pedido en estado "nuevo".
5.  **Pagos en Línea (Opcional/Futuro):** Desarrollar la integración de Stripe (cuyo webhook ya está esbozado en `app/api/webhook/`) para permitir pagos con tarjeta directo en el menú.

## 🔄 Flujo de Funcionamiento Final de la Aplicación

1.  **Onboarding:** El SuperAdministrador de FoodSPV registra un nuevo restaurante en el sistema y le entrega las credenciales de acceso al dueño.
2.  **Setup del Restaurante:** El dueño (Admin) inicia sesión, configura los datos de su local y da de alta los platillos de su menú. Finalmente, imprime el Código QR generado en su panel.
3.  **Experiencia del Cliente:** Los comensales escanean el QR en la mesa o entran al link web. Navegan por un menú digital atractivo, agregan productos al carrito y envían su pedido ingresando solo su nombre y número de mesa/teléfono.
4.  **Gestión de Operaciones:** El pedido suena instantáneamente en la tablet/computadora del restaurante. El personal acepta la orden, la prepara y, al finalizar, la marca como entregada, manteniendo un control exacto de las ventas y los tiempos.
