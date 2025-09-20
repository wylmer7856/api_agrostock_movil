import { Router } from "../Dependencies/dependencias.ts";
import { getUsuarios, postUsuario, putUsuario, deleteUsuario } from "../Controller/UsuariosController.ts";

const UsuariosRouter = new Router();

UsuariosRouter.get("/Usuario", getUsuarios);          // Listar usuarios
UsuariosRouter.post("/Usuario", postUsuario);         // Crear usuario
UsuariosRouter.put("/Usuario", putUsuario);           // Editar usuario
UsuariosRouter.delete("/Usuario/:id", deleteUsuario); // Eliminar usuario por ID

UsuariosRouter.get("/Usuario/Ciudad/:id_ciudad", getUsuariosPorCiudad);
UsuariosRouter.get("/Usuario/Departamento/:id_departamento", getUsuariosPorDepartamento);
UsuariosRouter.get("/Usuario/Region/:id_region", getUsuariosPorRegion);


export { UsuariosRouter };
