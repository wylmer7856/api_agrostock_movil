import { Router } from "../Dependencies/dependencias.ts";
import {
  getConsejos,
  postConsejo,
  putConsejo,
  deleteConsejo,
} from "../Controller/ConsejosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const ConsejosRouter = new Router();

ConsejosRouter
  .get("/Consejo", AuthMiddleware(["admin", "consumidor", "productor"]), getConsejos) // Listar consejos
  .post("/Consejo", AuthMiddleware(["admin", "consumidor", "productor"]), postConsejo)              // Crear consejo
  .put("/Consejo", AuthMiddleware(["admin", "consumidor", "productor"]), putConsejo)                // Editar consejo
  .delete("/Consejo/:id", AuthMiddleware(["admin", "consumidor", "productor"]), deleteConsejo);     // Eliminar consejo

export { ConsejosRouter };
