import { Application } from "./Dependencies/dependencias.ts";
import { UsuariosRouter } from "./Routers/UsuariosRouter.ts";
import { AuthRouter } from "./Routers/AuthRouter.ts";
import { ProductosRouter } from "./Routers/ProductosRouter.ts";
import { RegionesRouter } from "./Routers/RegionesRouter.ts";
import { DepartamentosRouter } from "./Routers/DepartamentosRouter.ts";
import { CiudadesRouter } from "./Routers/CiudadesRouter.ts";
import { AlertasRouter } from "./Routers/Alertas_StockRouter.ts";
import { DetallePedidosRouter } from "./Routers/Detalle_PedidosRouter.ts";
import { pedidosRouter } from "./Routers/PedidosRouter.ts";
import { MensajesRouter } from "./Routers/MensajesRouter.ts";
import { ReportesRouter } from "./Routers/ReportesRouter.ts";
import { CategoriasRouter } from "./Routers/CategoriasRouter.ts";
import { EstadisticasRouter } from "./Routers/EstadisticasRouter.ts";
import { AdminRouter } from "./Routers/AdminRouter.ts";
import { CartRouter } from "./Routers/CartRouter.ts";
import { ReseñasRouter } from "./Routers/ReseñasRouter.ts";

// Importar middlewares avanzados - Temporalmente deshabilitados para debug
// import { 
//   requestLoggingMiddleware, 
//   securityHeadersMiddleware, 
//   compressionMiddleware,
//   rateLimitMiddleware
//   // metricsMiddleware - temporalmente deshabilitado
// } from "./Middlewares/AdvancedMiddlewares.ts";

const app = new Application();

// 📌 Middlewares globales (orden importante) - Temporalmente deshabilitados para debug
// app.use(requestLoggingMiddleware());
// app.use(securityHeadersMiddleware());
// app.use(compressionMiddleware());
// app.use(rateLimitMiddleware(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
// app.use(metricsMiddleware()); // Temporalmente deshabilitado para debug

// Middleware CORS personalizado
app.use(async (ctx, next) => {
  const origin = ctx.request.headers.get("origin");
  
  // En producción, especificar dominios permitidos
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080", 
    "http://localhost:5173",
    "https://agrostock.com"
  ];
  
  if (!origin || allowedOrigins.includes(origin)) {
    ctx.response.headers.set("Access-Control-Allow-Origin", origin || "*");
  }
  
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset");
  ctx.response.headers.set("Access-Control-Allow-Credentials", "true");
  ctx.response.headers.set("Access-Control-Max-Age", "86400");
  
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 200;
    return;
  }
  
  await next();
});

// 📌 Routers principales (orden de prioridad)
const routers = [
  AuthRouter,           // Autenticación (prioridad alta)
  CartRouter,           // Carrito de compras (nuevo)
  ProductosRouter,      // Productos (público y privado)
  CategoriasRouter,     // Categorías
  ReseñasRouter,        // Sistema de reseñas
  MensajesRouter,       // Sistema de mensajes
  ReportesRouter,       // Sistema de reportes
  EstadisticasRouter,   // Estadísticas
  AdminRouter,          // Panel de administración
  UsuariosRouter,       // Gestión de usuarios
  RegionesRouter,       // Regiones
  DepartamentosRouter,  // Departamentos
  CiudadesRouter,       // Ciudades
  AlertasRouter,        // Alertas de stock
  DetallePedidosRouter, // Detalle de pedidos
  pedidosRouter         // Pedidos
];

// Registrar todos los routers
routers.forEach((router) => {
  app.use(router.routes());
  app.use(router.allowedMethods());
});

// 📌 Middleware de manejo de errores global mejorado
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("🚨 Error en el servidor:", err);
    
    // Log del error con más detalles
    console.error("📊 Detalles del error:", {
      method: ctx.request.method,
      url: ctx.request.url.pathname,
      ip: ctx.request.ip,
      userAgent: ctx.request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });

    // Determinar el tipo de error y responder apropiadamente
    let status = 500;
    let message = "Error interno del servidor";
    let errorCode = "INTERNAL_ERROR";

    if (err instanceof Error) {
      if (err.name === "ValidationError") {
        status = 400;
        message = "Datos de entrada inválidos";
        errorCode = "VALIDATION_ERROR";
      } else if (err.name === "UnauthorizedError") {
        status = 401;
        message = "No autorizado";
        errorCode = "UNAUTHORIZED";
      } else if (err.name === "ForbiddenError") {
        status = 403;
        message = "Acceso denegado";
        errorCode = "FORBIDDEN";
      } else if (err.name === "NotFoundError") {
        status = 404;
        message = "Recurso no encontrado";
        errorCode = "NOT_FOUND";
      }
    }

    ctx.response.status = status;
    ctx.response.body = { 
      success: false,
      error: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID()
    };
  }
});

// 📌 Middleware para rutas no encontradas mejorado
app.use(async (ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    success: false,
    error: "RUTA_NO_ENCONTRADA",
    message: "La ruta solicitada no existe en el servidor.",
    timestamp: new Date().toISOString(),
    available_routes: {
      auth: {
        login: "POST /auth/login",
        register: "POST /auth/register",
        logout: "POST /auth/logout",
        verify: "GET /auth/verify",
        change_password: "POST /auth/change-password"
      },
      cart: {
        get: "GET /cart",
        add: "POST /cart/add",
        update: "PUT /cart/item/:id",
        remove: "DELETE /cart/item/:id",
        clear: "DELETE /cart/clear",
        validate: "GET /cart/validate",
        checkout: "POST /cart/checkout",
        stats: "GET /cart/stats"
      },
      productos: {
        list: "GET /productos",
        get: "GET /productos/:id",
        create: "POST /productos",
        update: "PUT /productos/:id",
        delete: "DELETE /productos/:id",
        search: "GET /productos/search",
        by_user: "GET /productos/usuario/:id"
      },
      categorias: "GET /categorias",
      resenas: "GET|POST|PUT|DELETE /Resena",
      mensajes: "GET|POST /mensajes",
      reportes: "GET|POST /reportes",
      estadisticas: "GET /estadisticas",
      admin: "GET|POST|PUT|DELETE /admin/*",
      usuarios: "GET|POST|PUT|DELETE /usuarios",
      ubicaciones: {
        regiones: "GET /regiones",
        departamentos: "GET /departamentos",
        ciudades: "GET /ciudades"
      }
    },
    documentation: "https://docs.agrostock.com/api",
    support: "support@agrostock.com"
  };
});

// 📌 Información del servidor al iniciar
console.log("🚀 Servidor AgroStock API iniciando...");
console.log("📋 Configuración:");
console.log("   🔐 Autenticación: JWT con sesiones");
console.log("   🛒 Carrito: Sistema completo de compras");
console.log("   📧 Email: Servicio de notificaciones");
console.log("   🔔 Push: Notificaciones en tiempo real");
console.log("   🛡️ Seguridad: Rate limiting, validaciones");
console.log("   📊 Métricas: Logging y analytics");

console.log("📋 Rutas disponibles:");
console.log("  🔐 Autenticación: /auth/*");
console.log("  🛒 Carrito: /cart/*");
console.log("  🛍️  Productos: /productos/*");
console.log("  📂 Categorías: /categorias");
console.log("  ⭐ Reseñas: /Resena/*");
console.log("  💬 Mensajes: /mensajes");
console.log("  📊 Reportes: /reportes");
console.log("  📈 Estadísticas: /estadisticas");
console.log("  👨‍💼 Administración: /admin");
console.log("  👥 Usuarios: /usuarios");
console.log("  🌍 Ubicaciones: /regiones, /departamentos, /ciudades");

// 📌 Función para encontrar puerto disponible
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    try {
      const listener = Deno.listen({ port: port, hostname: "127.0.0.1" });
      listener.close();
      return port;
    } catch {
      continue;
    }
  }
  throw new Error("No se encontró puerto disponible");
}

// 📌 Iniciar servidor
const startPort = Deno.env.get("PORT") ? parseInt(Deno.env.get("PORT")!) : 5000;
const PORT = await findAvailablePort(startPort);
const HOST = "127.0.0.1";

console.log(`🌐 Servidor corriendo en http://${HOST}:${PORT}`);
console.log("✅ AgroStock API lista para recibir conexiones");

await app.listen({ port: PORT, hostname: HOST });
