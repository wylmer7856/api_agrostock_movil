import { Router } from "../Dependencies/dependencias.ts";
import { getProductos, getProductoPorId, getProductosPorUsuario, getProductosDisponibles, buscarProductos, postProducto, putProducto, deleteProducto} from "../Controller/ProductosController.ts";

const ProductosRouter = new Router();

// Rutas específicas primero (antes de las genéricas)
ProductosRouter.get("/productos/disponibles", getProductosDisponibles);
ProductosRouter.get("/productos/buscar", buscarProductos);
ProductosRouter.get("/productos/usuario/:id", getProductosPorUsuario);

ProductosRouter.get("/productos", getProductos);
ProductosRouter.get("/productos/:id", getProductoPorId);
ProductosRouter.post("/productos", postProducto);
ProductosRouter.put("/productos/:id", putProducto);
ProductosRouter.delete("/productos/:id", deleteProducto);

export { ProductosRouter };