import { Router } from "../Dependencies/dependencias.ts";
import { getProductos, postProducto, putProducto, deleteProducto } from "../Controller/ProductosController.ts";

const ProductosRouter = new Router();

ProductosRouter.get("/productos", getProductos);
ProductosRouter.post("/productos", postProducto);
ProductosRouter.put("/productos/:id", putProducto);
ProductosRouter.delete("/productos/:id", deleteProducto);


export { ProductosRouter };