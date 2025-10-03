import { Router } from "../Dependencies/dependencias.ts";
import { CategoriasController } from "../Controller/CategoriasController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas públicas para categorías
router.get("/", CategoriasController.ListarCategorias);
router.get("/:id_categoria", CategoriasController.ObtenerCategoriaPorId);
router.get("/:id_categoria/productos", CategoriasController.ObtenerProductosPorCategoria);
router.get("/producto/:id_producto", CategoriasController.ObtenerCategoriasDeProducto);

// 📌 Rutas para administradores
router.get("/admin/todas", AuthMiddleware(['admin']), CategoriasController.ListarTodasLasCategorias);
router.post("/admin/crear", AuthMiddleware(['admin']), CategoriasController.CrearCategoria);
router.put("/admin/:id_categoria", AuthMiddleware(['admin']), CategoriasController.ActualizarCategoria);
router.delete("/admin/:id_categoria", AuthMiddleware(['admin']), CategoriasController.EliminarCategoria);

// 📌 Rutas para asociar productos con categorías
router.post("/admin/:id_producto/:id_categoria", AuthMiddleware(['admin']), CategoriasController.AsociarProductoCategoria);
router.delete("/admin/:id_producto/:id_categoria", AuthMiddleware(['admin']), CategoriasController.DesasociarProductoCategoria);

export { router as CategoriasRouter };
