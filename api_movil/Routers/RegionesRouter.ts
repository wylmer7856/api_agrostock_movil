import { Router } from "../Dependencies/dependencias.ts";
import {
  getRegiones,
  postRegiones,
  putRegiones,
  deleteRegiones,
} from "../Controller/RegionesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const Regionesrouter = new Router();

Regionesrouter
  .get("/regiones", AuthMiddleware(["admin", "productor"]), getRegiones) // Listar regiones
  .post("/regiones", AuthMiddleware(["admin"]), postRegiones)            // Crear región
  .put("/regiones", AuthMiddleware(["admin"]), putRegiones)              // Editar región
  .delete("/regiones/:id", AuthMiddleware(["admin"]), deleteRegiones);  // Eliminar región

export { Regionesrouter };
