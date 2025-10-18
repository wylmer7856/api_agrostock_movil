import { Router } from "../Dependencies/dependencias.ts";
import { 
  getProductoPorId, 
  getProductosPorUsuario, 
  getProductosDisponibles, 
  postProducto, 
  putProducto, 
  deleteProducto,
  getProductosConInfo,
  buscarProductosAvanzado,
  getProductosPorProductor,
  getProductoDetallado
} from "../Controller/ProductosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const ProductosRouter = new Router();

// 📌 Rutas públicas (sin autenticación)
ProductosRouter
  .get("/productos", getProductosConInfo) // Lista pública de productos con info completa
  .get("/productos/buscar", buscarProductosAvanzado) // Búsqueda avanzada pública
  .get("/productos/:id", getProductoPorId) // Ver producto individual
  .get("/productos/:id/detalle", getProductoDetallado) // Ver producto detallado
  .get("/productos/productor/:id", getProductosPorProductor); // Productos de un productor específico

// 📌 Rutas con autenticación
ProductosRouter
  .get("/productos/disponibles", AuthMiddleware(["admin", "productor", "consumidor"]), getProductosDisponibles)
  .get("/productos/usuario/:id", AuthMiddleware(["admin", "productor", "consumidor"]), getProductosPorUsuario)
  .post("/productos", AuthMiddleware(["admin", "productor"]), postProducto)
  .put("/productos/:id", AuthMiddleware(["admin", "productor"]), putProducto)
  .delete("/productos/:id", AuthMiddleware(["admin", "productor"]), deleteProducto);

export { ProductosRouter };
