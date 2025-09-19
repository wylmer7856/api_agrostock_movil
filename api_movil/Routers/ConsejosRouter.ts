import { Router } from "../Dependencies/dependencias.ts";
import { 
  getConsejos, 
  postConsejo, 
  putConsejo, 
  deleteConsejo 
} from "../Controller/ConsejosController.ts";

const ConsejosRouter = new Router();

ConsejosRouter.get("/Consejo", getConsejos);          // Listar consejos
ConsejosRouter.post("/Consejo", postConsejo);         // Crear consejo
ConsejosRouter.put("/Consejo", putConsejo);           // Editar consejo
ConsejosRouter.delete("/Consejo/:id", deleteConsejo); // Eliminar consejo por ID

export { ConsejosRouter };
