import { Router } from "../Dependencies/dependencias.ts";
import {
  getDepartamentos,
  postDepartamentos,
  putDepartamentos,
  deleteDepartamentos,
} from "../Controller/DepartamentosController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const DepartamentosRouter = new Router();

DepartamentosRouter
  .get("/departamentos", AuthMiddleware(["admin", "productor"]), getDepartamentos)
  .post("/departamentos", AuthMiddleware(["admin"]), postDepartamentos)
  .put("/departamentos", AuthMiddleware(["admin"]), putDepartamentos)
  .delete("/departamentos/:id", AuthMiddleware(["admin"]), deleteDepartamentos);

export { DepartamentosRouter };
