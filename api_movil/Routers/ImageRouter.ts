// 🖼️ ROUTER DE IMÁGENES

import { Router } from "../Dependencies/dependencias.ts";
import { AuthMiddleware } from "../Middlewares/AuthMiddleware.ts";
import {
  uploadProductImage,
  uploadProductorProfileImage,
  deleteImage
} from "../Controller/ImageController.ts";

export const ImageRouter = new Router();

// Rutas protegidas
ImageRouter
  .post("/images/producto/:id", AuthMiddleware(['productor', 'admin']), uploadProductImage)
  .post("/images/productor/perfil", AuthMiddleware(['productor']), uploadProductorProfileImage)
  .delete("/images/:path", AuthMiddleware(['admin']), deleteImage);



