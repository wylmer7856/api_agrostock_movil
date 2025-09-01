import { Router } from "../Dependencies/dependencias.ts";
import {getDepartamentos, postDepartamentos, putDepartamentos, deleteDepartamentos} from "../Controller/DepartamentosController.ts";

const DepartamentosRouter = new Router();

DepartamentosRouter.get("/departamentos", getDepartamentos);
DepartamentosRouter.post("/departamentos", postDepartamentos);
DepartamentosRouter.put("/departamentos", putDepartamentos);
DepartamentosRouter.delete("/departamentos/:id", deleteDepartamentos);

export { DepartamentosRouter };
