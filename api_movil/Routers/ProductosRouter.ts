import { Router } from "../Dependencies/dependencias.ts";
import { getProductos, getProductoPorId, postProducto, putProducto, deleteProducto} from "../Controller/ProductosController.ts";

const ProductosRouter = new Router();

ProductosRouter.get("/productos", getProductos);
ProductosRouter.get("/productos/:id", getProductoPorId);
ProductosRouter.post("/productos", postProducto);
ProductosRouter.put("/productos/:id", putProducto);
ProductosRouter.delete("/productos/:id", deleteProducto);

export { ProductosRouter };