import { Router } from "../Dependencies/dependencias.ts";
import { MensajesController } from "../Controller/MensajesController.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";

const router = new Router();

// 📌 Rutas para mensajes (requieren autenticación)
router.post("/enviar", AuthMiddleware(['consumidor', 'productor']), MensajesController.EnviarMensaje);
router.get("/recibidos", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerMensajesRecibidos);
router.get("/enviados", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerMensajesEnviados);
router.put("/mensajes/:id_mensaje/leer", AuthMiddleware(['consumidor', 'productor']), MensajesController.MarcarComoLeido);
router.delete("/mensajes/:id_mensaje", AuthMiddleware(['consumidor', 'productor']), MensajesController.EliminarMensaje);
router.get("/no-leidos", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerMensajesNoLeidos);
router.get("/mensajes/conversacion/:id_usuario", AuthMiddleware(['consumidor', 'productor']), MensajesController.ObtenerConversacion);

// 📌 Ruta para contactar productor (sin autenticación)
router.post("/contactar-productor", MensajesController.ContactarProductor);

export { router as MensajesRouter };
