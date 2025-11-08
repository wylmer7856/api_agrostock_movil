import { Router } from "../Dependencies/dependencias.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";
import {
  getProductores,
  getProductorPorUsuario,
  getMiPerfilProductor,
  postProductor,
  putProductor,
  deleteProductor
} from "../Controller/ProductoresController.ts";

export const ProductoresRouter = new Router();

// Rutas públicas
ProductoresRouter
  .get("/productores", getProductores) // Listar productores (público para catálogo)
  .get("/productores/usuario/:id", getProductorPorUsuario); // Ver perfil de productor (público)

// Rutas protegidas - Solo productores
ProductoresRouter
  .get("/productores/mi-perfil", AuthMiddleware(['productor']), getMiPerfilProductor)
  .post("/productores", AuthMiddleware(['productor']), postProductor)
  .put("/productores/:id", AuthMiddleware(['productor', 'admin']), putProductor);

// Rutas protegidas - Solo admin
ProductoresRouter
  .delete("/productores/:id", AuthMiddleware(['admin']), deleteProductor);



