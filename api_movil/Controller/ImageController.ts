// 🖼️ CONTROLADOR DE IMÁGENES
// Endpoints para subir y gestionar imágenes

import { Context, RouterContext } from "../Dependencies/dependencias.ts";
import { imageService } from "../Services/ImageService.ts";

/**
 * Subir imagen de producto
 * POST /images/producto/:id
 */
export const uploadProductImage = async (ctx: RouterContext<"/images/producto/:id">) => {
  try {
    const user = ctx.state.user;
    const idProducto = Number(ctx.params.id);

    if (isNaN(idProducto) || idProducto <= 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "ID_INVALIDO",
        message: "ID de producto inválido"
      };
      return;
    }

    // Verificar que el producto pertenece al usuario o es admin
    const { conexion } = await import("../Models/Conexion.ts");
    const producto = await conexion.query(
      "SELECT id_usuario, imagen_principal FROM productos WHERE id_producto = ?",
      [idProducto]
    );

    if (producto.length === 0) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Producto no encontrado"
      };
      return;
    }

    if (producto[0].id_usuario !== user.id && user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "No tienes permisos para subir imágenes a este producto"
      };
      return;
    }

    // Guardar referencia a la imagen anterior para eliminarla después
    const imagenAnterior = producto[0].imagen_principal;

    // Obtener datos de imagen
    const contentType = ctx.request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Intentar leer FormData
      try {
        const body = ctx.request.body;
        const formData = await body.formData();
        const result = await imageService.saveImageFromFormData(
          formData,
          `productos/${idProducto}`,
          "image"
        );

        if (result.success && result.path) {
          // Eliminar imagen anterior si existe
          if (imagenAnterior) {
            try {
              await imageService.deleteImage(imagenAnterior);
              console.log(`Imagen anterior eliminada: ${imagenAnterior}`);
            } catch (deleteError) {
              console.error("Error eliminando imagen anterior:", deleteError);
              // Continuar aunque falle la eliminación de la imagen anterior
            }
          }

          // Actualizar producto con nueva imagen
          await conexion.execute(
            "UPDATE productos SET imagen_principal = ? WHERE id_producto = ?",
            [result.path, idProducto]
          );

          const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
          const imageUrl = imageService.buildImageUrl(result.path, baseUrl);

          ctx.response.status = 200;
          ctx.response.body = {
            success: true,
            message: "Imagen subida exitosamente",
            data: {
              path: result.path,
              url: imageUrl
            }
          };
          return;
        } else {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: result.error || "UPLOAD_ERROR",
            message: result.message || "Error al subir la imagen"
          };
          return;
        }
      } catch (formDataError) {
        console.log("FormData no disponible, intentando JSON:", formDataError);
        // Continuar al bloque JSON
      }
    }
    
    // Procesar como JSON (base64)
    if (contentType.includes("application/json") || !contentType.includes("multipart/form-data")) {
      // Soporte para base64
      const body = await ctx.request.body.json();
      const { imageData } = body;

      if (!imageData) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "NO_IMAGE_DATA",
          message: "No se proporcionó imagen"
        };
        return;
      }

      const result = await imageService.saveImage(
        imageData,
        `productos/${idProducto}`
      );

      if (result.success && result.path) {
        // Eliminar imagen anterior si existe
        if (imagenAnterior) {
          try {
            await imageService.deleteImage(imagenAnterior);
            console.log(`Imagen anterior eliminada: ${imagenAnterior}`);
          } catch (deleteError) {
            console.error("Error eliminando imagen anterior:", deleteError);
            // Continuar aunque falle la eliminación de la imagen anterior
          }
        }

        await conexion.execute(
          "UPDATE productos SET imagen_principal = ? WHERE id_producto = ?",
          [result.path, idProducto]
        );

        const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
        const imageUrl = imageService.buildImageUrl(result.path, baseUrl);

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Imagen subida exitosamente",
          data: {
            path: result.path,
            url: imageUrl
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: result.error || "UPLOAD_ERROR",
          message: result.message || "Error al subir la imagen"
        };
      }
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "INVALID_CONTENT_TYPE",
        message: "Content-Type debe ser multipart/form-data o application/json"
      };
    }
  } catch (error) {
    console.error("Error en uploadProductImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor"
    };
  }
};

/**
 * Subir imagen de perfil de productor
 * POST /images/productor/perfil
 */
export const uploadProductorProfileImage = async (ctx: Context) => {
  try {
    const user = ctx.state.user;

    if (!user || user.rol !== 'productor') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "Solo los productores pueden subir imágenes de perfil"
      };
      return;
    }

    const contentType = ctx.request.headers.get("content-type") || "";
    const { conexion } = await import("../Models/Conexion.ts");

    if (contentType.includes("multipart/form-data")) {
      try {
        const body = ctx.request.body;
        const formData = await body.formData();
        const result = await imageService.saveImageFromFormData(
          formData,
          `productores/${user.id}`,
          "image"
        );

        if (result.success && result.path) {
          // Actualizar perfil de productor
          await conexion.execute(
            "UPDATE productores SET foto_perfil_finca = ? WHERE id_usuario = ?",
            [result.path, user.id]
          );

          const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
          const imageUrl = imageService.buildImageUrl(result.path, baseUrl);

          ctx.response.status = 200;
          ctx.response.body = {
            success: true,
            message: "Imagen de perfil subida exitosamente",
            data: {
              path: result.path,
              url: imageUrl
            }
          };
          return;
        } else {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: result.error || "UPLOAD_ERROR",
            message: result.message || "Error al subir la imagen"
          };
          return;
        }
      } catch (formDataError) {
        console.log("FormData no disponible, intentando JSON:", formDataError);
        // Continuar al bloque JSON
      }
    }
    
    // Procesar como JSON (base64)
    if (contentType.includes("application/json") || !contentType.includes("multipart/form-data")) {
      const body = await ctx.request.body.json();
      const { imageData } = body;

      if (!imageData) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: "NO_IMAGE_DATA",
          message: "No se proporcionó imagen"
        };
        return;
      }

      const result = await imageService.saveImage(
        imageData,
        `productores/${user.id}`
      );

      if (result.success && result.path) {
        await conexion.execute(
          "UPDATE productores SET foto_perfil_finca = ? WHERE id_usuario = ?",
          [result.path, user.id]
        );

        const baseUrl = `${ctx.request.url.protocol}//${ctx.request.url.host}`;
        const imageUrl = imageService.buildImageUrl(result.path, baseUrl);

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          message: "Imagen de perfil subida exitosamente",
          data: {
            path: result.path,
            url: imageUrl
          }
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: result.error || "UPLOAD_ERROR",
          message: result.message || "Error al subir la imagen"
        };
      }
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: "INVALID_CONTENT_TYPE",
        message: "Content-Type debe ser multipart/form-data o application/json"
      };
    }
  } catch (error) {
    console.error("Error en uploadProductorProfileImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor"
    };
  }
};

/**
 * Eliminar imagen
 * DELETE /images/:path
 */
export const deleteImage = async (ctx: RouterContext<"/images/:path">) => {
  try {
    const user = ctx.state.user;
    const imagePath = ctx.params.path;

    // Solo admin puede eliminar imágenes directamente
    if (user.rol !== 'admin') {
      ctx.response.status = 403;
      ctx.response.body = {
        success: false,
        error: "NO_AUTORIZADO",
        message: "Solo los administradores pueden eliminar imágenes"
      };
      return;
    }

    const deleted = await imageService.deleteImage(imagePath);

    if (deleted) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Imagen eliminada exitosamente"
      };
    } else {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: "NO_ENCONTRADO",
        message: "Imagen no encontrada"
      };
    }
  } catch (error) {
    console.error("Error en deleteImage:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: "ERROR_INTERNO",
      message: "Error interno del servidor"
    };
  }
};

