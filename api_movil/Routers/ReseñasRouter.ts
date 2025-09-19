import { Router } from "../Dependencies/dependencias.ts";
import { 
  getResenas, 
  postResena, 
  putResena, 
  deleteResena, 
  getResenasByProducto 
} from "../Controller/ReseñasController.ts";

const ResenasRouter = new Router();

ResenasRouter.get("/Resena", getResenas);                 // Listar reseñas
ResenasRouter.post("/Resena", postResena);                // Crear reseña
ResenasRouter.put("/Resena", putResena);                  // Editar reseña
ResenasRouter.delete("/Resena/:id", deleteResena);        // Eliminar reseña por ID
ResenasRouter.get("/Resena/Producto/:id", getResenasByProducto); // Reseñas de un producto

export { ResenasRouter };