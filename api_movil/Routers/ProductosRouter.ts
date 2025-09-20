import { Router } from "../Dependencies/dependencias.ts";
import { getProductos, getProductoPorId, getProductosPorUsuario, getProductosDisponibles, buscarProductos, postProducto, putProducto, deleteProducto} from "../Controller/ProductosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const ProductosRouter = new Router();

// Rutas específicas primero
ProductosRouter
  .get("/productos/disponibles", AuthMiddleware(["admin", "productor", "consumidor"]), getProductosDisponibles)
  .get("/productos/buscar", AuthMiddleware(["admin", "productor", "consumidor"]), buscarProductos)
  .get("/productos/usuario/:id", AuthMiddleware(["admin", "productor", "consumidor"]), getProductosPorUsuario);

ProductosRouter
  .get("/productos", AuthMiddleware(["admin", "productor", "consumidor"]), getProductos)
  .get("/productos/:id", AuthMiddleware(["admin", "productor", "consumidor"]), getProductoPorId)
  .post("/productos", AuthMiddleware(["admin", "productor"]), postProducto)
  .put("/productos/:id", AuthMiddleware(["admin", "productor"]), putProducto)
  .delete("/productos/:id", AuthMiddleware(["admin", "productor"]), deleteProducto);

export { ProductosRouter };
