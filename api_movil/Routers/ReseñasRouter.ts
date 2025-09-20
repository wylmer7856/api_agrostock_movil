import { Router } from "../Dependencies/dependencias.ts";
import {
  getResenas,
  postResena,
  putResena,
  deleteResena,
  getResenasByProducto,
} from "../Controller/ReseñasController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const ResenasRouter = new Router();

// Rutas protegidas por rol
ResenasRouter
  .get("/Resena", AuthMiddleware(["admin"]), getResenas) // Listar todas las reseñas
  .post("/Resena", AuthMiddleware(["consumidor"]), postResena) // Crear reseña
  .put("/Resena", AuthMiddleware(["consumidor"]), putResena) // Editar reseña
  .delete("/Resena/:id", AuthMiddleware(["admin"]), deleteResena) // Eliminar reseña
  .get("/Resena/Producto/:id", AuthMiddleware(["admin", "consumidor"]), getResenasByProducto); // Ver reseñas por producto

export { ResenasRouter };
