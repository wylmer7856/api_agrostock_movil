import { Router } from "../Dependencies/dependencias.ts";
import { AdminController } from "../Controller/AdminController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para administración de usuarios
router.get("/usuarios", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosUsuarios);
router.post("/usuarios/crear", AuthMiddleware(['admin']), AdminController.CrearUsuario);
router.put("/usuarios/:id_usuario", AuthMiddleware(['admin']), AdminController.EditarUsuario);
router.delete("/usuarios/:id_usuario", AuthMiddleware(['admin']), AdminController.EliminarUsuario);

// 📌 Rutas para administración de productos
router.get("/productos", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosProductos);
router.delete("/productos/:id_producto/inapropiado", AuthMiddleware(['admin']), AdminController.EliminarProductoInapropiado);

// 📌 Rutas para administración de reportes
router.get("/reportes", AuthMiddleware(['admin']), AdminController.ObtenerTodosLosReportes);
router.put("/reportes/:id_reporte/resolver", AuthMiddleware(['admin']), AdminController.ResolverReporte);
router.delete("/reportes/:id_reporte/resuelto", AuthMiddleware(['admin']), AdminController.EliminarReporteResuelto);

// 📌 Rutas para estadísticas y actividad
router.get("/estadisticas", AuthMiddleware(['admin']), AdminController.ObtenerEstadisticasGenerales);
router.get("/actividad-reciente", AuthMiddleware(['admin']), AdminController.ObtenerActividadReciente);

// 📌 Rutas para acceso a paneles
router.get("/panel/productor/:id_usuario", AuthMiddleware(['admin']), AdminController.AccederPanelProductor);
router.get("/panel/consumidor/:id_usuario", AuthMiddleware(['admin']), AdminController.AccederPanelConsumidor);

export { router as AdminRouter };
