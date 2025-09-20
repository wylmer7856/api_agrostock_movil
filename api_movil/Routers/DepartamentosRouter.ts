import { Router } from "../Dependencies/dependencias.ts";
import { getDepartamentos } from "../Controller/DepartamentosController.ts";

const DepartamentosRouter = new Router();

DepartamentosRouter.get("/departamentos", getDepartamentos);

export { DepartamentosRouter };
