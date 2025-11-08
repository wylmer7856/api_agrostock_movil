import { Router } from "../Dependencies/dependencias.ts";
import { CategoriasController } from "../Controller/CategoriasController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas públicas para categorías
router.get("/categorias", CategoriasController.ListarCategorias);
router.get("/", CategoriasController.ListarCategorias); // Alias para compatibilidad
router.get("/categorias/:id_categoria", CategoriasController.ObtenerCategoriaPorId);
router.get("/categorias/:id_categoria/productos", CategoriasController.ObtenerProductosPorCategoria);
router.get("/productos/:id_producto/categorias", CategoriasController.ObtenerCategoriasDeProducto);

// 📌 Rutas para administradores
router.get("/admin/todas", AuthMiddleware(['admin']), CategoriasController.ListarTodasLasCategorias);
router.post("/admin/crear", AuthMiddleware(['admin']), CategoriasController.CrearCategoria);
router.put("/categorias/:id_categoria", AuthMiddleware(['admin']), CategoriasController.ActualizarCategoria);
router.delete("/categorias/:id_categoria", AuthMiddleware(['admin']), CategoriasController.EliminarCategoria);

// 📌 Rutas para asociar productos con categorías
router.post("/categorias/:id_categoria/productos/:id_producto", AuthMiddleware(['admin']), CategoriasController.AsociarProductoCategoria);
router.delete("/categorias/:id_categoria/productos/:id_producto", AuthMiddleware(['admin']), CategoriasController.DesasociarProductoCategoria);

export { router as CategoriasRouter };
