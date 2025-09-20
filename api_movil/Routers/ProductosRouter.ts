import { Router } from "../Dependencies/dependencias.ts";
import {
  getProductos,
  getProductoPorId,
  postProducto,
  putProducto,
  deleteProducto,
} from "../Controller/ProductosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const ProductosRouter = new Router();

ProductosRouter
  .get("/productos", AuthMiddleware(["admin", "productor", "consumidor"]), getProductos)
  .get("/productos/:id", AuthMiddleware(["admin", "productor", "consumidor"]), getProductoPorId)
  .post("/productos", AuthMiddleware(["admin", "productor"]), postProducto)
  .put("/productos/:id", AuthMiddleware(["admin", "productor"]), putProducto)
  .delete("/productos/:id", AuthMiddleware(["admin", "productor"]), deleteProducto);

export { ProductosRouter };
