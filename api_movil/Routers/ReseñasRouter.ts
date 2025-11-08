import { Router } from "../Dependencies/dependencias.ts";
import {
  getResenas,
  postResena,
  putResena,
  deleteResena,
  getResenasByProducto,
} from "../Controller/ReseñasController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const ReseñasRouter = new Router();

// 📌 Rutas públicas (sin autenticación)
ReseñasRouter
  .get("/resenas/producto/:id", getResenasByProducto); // Ver reseñas por producto (público)

// 📌 Rutas protegidas por rol - Usar nombres estándar REST (minúsculas)
ReseñasRouter
  .get("/resenas", AuthMiddleware(["admin"]), getResenas) // Listar todas las reseñas (solo admin)
  .post("/resenas", AuthMiddleware(["consumidor", "productor"]), postResena) // Crear reseña
  .put("/resenas/:id", AuthMiddleware(["consumidor", "productor"]), putResena) // Editar reseña
  .delete("/resenas/:id", AuthMiddleware(["admin"]), deleteResena); // Eliminar reseña (solo admin)

export { ReseñasRouter };
