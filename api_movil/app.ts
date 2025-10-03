import { Application, oakCors } from "./Dependencies/dependencias.ts";
import { UsuariosRouter } from "./Routers/UsuariosRouter.ts";
import { AuthRouter } from "./Routers/AuthRouter.ts";
import { ProductosRouter } from "./Routers/ProductosRouter.ts";
import { Regionesrouter } from "./Routers/RegionesRouter.ts";
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

const app = new Application();

// Configurar CORS
app.use(oakCors({
  origin: "*", // En producción, especificar dominios permitidos
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 📌 Routers principales
const routers = [
  AuthRouter,           // Autenticación
  ProductosRouter,      // Productos (público y privado)
  CategoriasRouter,     // Categorías
  MensajesRouter,       // Sistema de mensajes
  ReportesRouter,       // Sistema de reportes
  EstadisticasRouter,   // Estadísticas
  AdminRouter,          // Panel de administración
  UsuariosRouter,       // Gestión de usuarios
  Regionesrouter,       // Regiones
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

// 📌 Middleware de manejo de errores global
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Error en el servidor:", err);
    ctx.response.status = 500;
    ctx.response.body = { 
      success: false,
      error: "Error interno del servidor",
      message: "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo."
    };
  }
});

// 📌 Middleware para rutas no encontradas
app.use(async (ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    success: false,
    error: "Ruta no encontrada",
    message: "La ruta solicitada no existe en el servidor.",
    available_routes: {
      auth: "/auth/login",
      productos: "/productos",
      categorias: "/categorias",
      mensajes: "/mensajes",
      reportes: "/reportes",
      estadisticas: "/estadisticas",
      admin: "/admin",
      usuarios: "/usuarios",
      regiones: "/regiones",
      departamentos: "/departamentos",
      ciudades: "/ciudades"
    }
  };
});

console.log("🚀 Servidor AgroStock API corriendo en el puerto 8000");
console.log("📋 Rutas disponibles:");
console.log("  🔐 Autenticación: /auth/login");
console.log("  🛍️  Productos: /productos");
console.log("  📂 Categorías: /categorias");
console.log("  💬 Mensajes: /mensajes");
console.log("  📊 Reportes: /reportes");
console.log("  📈 Estadísticas: /estadisticas");
console.log("  👨‍💼 Administración: /admin");
console.log("  👥 Usuarios: /usuarios");
console.log("  🌍 Ubicaciones: /regiones, /departamentos, /ciudades");

await app.listen({ port: 8000 });
