import { Router } from "../Dependencies/dependencias.ts";
import { AdminController } from "../Controller/AdminController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para administración de usuarios
router.get("/admin/usuarios", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosUsuarios);
router.post("/admin/usuarios/crear", AuthMiddleware(['admin']), AdminController.CrearUsuario);
router.put("/admin/usuario/:id_usuario", AuthMiddleware(['admin']), AdminController.EditarUsuario);
router.delete("/admin/usuario/:id_usuario", AuthMiddleware(['admin']), AdminController.EliminarUsuario);

// 📌 Rutas para administración de productos
router.get("/admin/productos", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosProductos);
router.delete("/admin/producto/:id_producto", AuthMiddleware(['admin']), AdminController.EliminarProductoInapropiado);

// 📌 Rutas para administración de reportes
router.get("/admin/reportes", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosReportes);
router.put("/admin/reporte/:id_reporte", AuthMiddleware(['admin']), AdminController.ResolverReporte);
router.delete("/admin/reporte/:id_reporte", AuthMiddleware(['admin']), AdminController.EliminarReporteResuelto);

// 📌 Rutas para estadísticas y actividad
router.get("/admin/estadisticas", AuthMiddleware(['admin']), AdminController.ObtenerEstadisticasGenerales);
router.get("/admin/actividad-reciente", AuthMiddleware(['admin']), AdminController.ObtenerActividadReciente);

// 📌 Rutas para acceso a paneles
router.get("/admin/usuario/:id_usuario/productor", AuthMiddleware(['admin']), AdminController.AccederPanelProductor);
router.get("/admin/usuario/:id_usuario/consumidor", AuthMiddleware(['admin']), AdminController.AccederPanelConsumidor);

export { router as AdminRouter };
