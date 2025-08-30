import { Router } from "../Dependencies/dependencias.ts";
import { getUsuarios, postUsuario, putUsuario, deleteUsuario } from "../Controller/UsuariosController.ts";

const UsuariosRouter = new Router();

UsuariosRouter.get("/Usuario", getUsuarios);          // Listar usuarios
UsuariosRouter.post("/Usuario", postUsuario);         // Crear usuario
UsuariosRouter.put("/Usuario", putUsuario);           // Editar usuario
UsuariosRouter.delete("/Usuario/:id", deleteUsuario); // Eliminar usuario por ID

export { UsuariosRouter };
