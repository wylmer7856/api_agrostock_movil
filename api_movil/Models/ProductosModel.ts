import { conexion } from "./Conexion.ts";
import { join } from "../Dependencies/dependencias.ts";

export interface ProductoData {
  id_producto: number;
  nombre: string;
  stock: number;
  stockMinimo: number;
  descripcion?: string;
  precio?: number;
  id_usuario?: number;
  id_ciudad_origen?: number;
  unidadMedida?: string;
  pesoAprox?: number;
  imagenPrincipal?: string;
}

export interface ProductoDataResponse extends ProductoData {
  imagenUrl?: string | null;
}

export class ProductosModel {
    public _objProducto: ProductoData | null;
    private readonly UPLOADS_DIR = "./uploads";

    constructor(objProducto: ProductoData | null = null) {
        this._objProducto = objProducto;
    }

    public async ListarProductos(): Promise<ProductoData[]> {
        try {
            const result = await conexion.query("SELECT * FROM productos ORDER BY id_producto DESC");
            return result as ProductoData[];
        } catch (error) {
            console.error("Error al listar productos:", error);
            throw new Error("Error al listar productos.");
        }
    }

    public async AgregarProducto(imagenData?: string): Promise<{ success: boolean; message: string; producto?: ProductoData }> {
        try {
            if (!this._objProducto) {
                throw new Error("No se proporciono un objeto de producto.");
            }

            const { nombre, descripcion, precio, stock, stockMinimo, id_usuario, id_ciudad_origen, unidadMedida, pesoAprox } = this._objProducto;

            if (!nombre || !descripcion || precio === undefined || stock === undefined || !id_usuario || !id_ciudad_origen) {
                throw new Error("Faltan campos obligatorios para agregar el producto.");
            }

            await conexion.execute("START TRANSACTION");

            const result = await conexion.execute(`INSERT INTO productos (nombre, descripcion, precio, stock, stockMinimo, id_usuario, id_ciudad_origen, unidadMedida, pesoAprox) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nombre, descripcion, precio, stock, stockMinimo || 10, id_usuario, id_ciudad_origen, unidadMedida, pesoAprox]
            );

            if (!result || !result.affectedRows || result.affectedRows === 0) {
                await conexion.execute("ROLLBACK");
                return { success: false, message: "No se pudo agregar el producto." };
            }

            const queryResult = await conexion.query("SELECT * FROM productos ORDER BY id_producto DESC LIMIT 1");
            const nuevoProducto = queryResult[0] as ProductoData;

            let rutaImagen = null;
            if (imagenData) {
                try {
                    rutaImagen = await this.guardarImagen(nuevoProducto.id_producto, imagenData);
                    
                    await conexion.execute("UPDATE productos SET imagenPrincipal = ? WHERE id_producto = ?", 
                    [rutaImagen, nuevoProducto.id_producto]
                    );
                } catch (imageError) {
                    console.error("Error al procesar imagen:", imageError);
                }
            }

            await conexion.execute("COMMIT");

            const productoFinal = await conexion.query("SELECT * FROM productos WHERE id_producto = ?", [nuevoProducto.id_producto]);

            return {
                success: true,
                message: "Producto agregado exitosamente.",
                producto: productoFinal[0] as ProductoData
            };

        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error("Error al agregar producto:", error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : "Error al agregar producto." 
            };
        }
    }

    public async EditarProducto(imagenData?: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!this._objProducto || !this._objProducto.id_producto) {
                throw new Error("No se proporciono un objeto de producto valido.");
            }
            const { id_producto, nombre, descripcion, precio, stock, stockMinimo, id_usuario, id_ciudad_origen, unidadMedida, pesoAprox } = this._objProducto;

            await conexion.execute("START TRANSACTION");

            let rutaImagen = this._objProducto.imagenPrincipal;
            
            if (imagenData) {
                if (this._objProducto.imagenPrincipal) {
                    const productDir = join(this.UPLOADS_DIR, id_producto.toString());
                    if (await this.existeDirectorio(productDir)) {
                        await Deno.remove(productDir, { recursive: true });
                    }
                }
                
                try {
                    rutaImagen = await this.guardarImagen(id_producto, imagenData);
                } catch (imageError) {
                    console.error("Error al procesar nueva imagen:", imageError);
                }
            }

            const result = await conexion.execute(`UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, stockMinimo = ?, id_usuario = ?, id_ciudad_origen = ?, unidadMedida = ?, pesoAprox = ?, imagenPrincipal = ? WHERE id_producto = ?`,
                [nombre, descripcion, precio, stock, stockMinimo, id_usuario, id_ciudad_origen, unidadMedida, pesoAprox, rutaImagen, id_producto]
            );

            if (result && result.affectedRows && result.affectedRows > 0) {
                await conexion.execute("COMMIT");
                return {
                    success: true,
                    message: "Producto editado exitosamente.",
                };
            } else {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "No se pudo editar el producto.",
                };
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error("Error al editar producto:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Error al editar el producto.",
            };
        }
    }

    public async EliminarProducto(id_producto: number): Promise<{ success: boolean; message: string }> {
        try {
            await conexion.execute("START TRANSACTION");

            const producto = await conexion.query("SELECT * FROM productos WHERE id_producto = ?", [id_producto]);
            
            if (!producto || producto.length === 0) {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "El producto no existe."
                };
            }

            const result = await conexion.execute("DELETE FROM productos WHERE id_producto = ?", [id_producto]);

            if (result && result.affectedRows && result.affectedRows > 0) {
                await this.eliminarCarpetaProducto(id_producto);
                
                await conexion.execute("COMMIT");
                return {
                    success: true,
                    message: "Producto eliminado exitosamente."
                };
            } else {
                await conexion.execute("ROLLBACK");
                return {
                    success: false,
                    message: "No se pudo eliminar el producto."
                };
            }
        } catch (error) {
            await conexion.execute("ROLLBACK");
            console.error("Error al eliminar producto:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Error al eliminar el producto."
            };
        }        
    }

    public async ObtenerProductoPorId(id_producto: number): Promise<ProductoData | null> {
        try {
            const result = await conexion.query("SELECT * FROM productos WHERE id_producto = ?", [id_producto]);
            return result.length > 0 ? result[0] as ProductoData : null;
        } catch (error) {
            console.error("Error al obtener producto por ID:", error);
            throw new Error("Error al obtener producto.");
        }
    }

    public construirUrlImagen(rutaImagen: string | null | undefined, baseUrl: string = "http://localhost:8000"): string | null {
        if (!rutaImagen) return null;
        return `${baseUrl}/${rutaImagen}`;
    }

    private async existeDirectorio(ruta: string): Promise<boolean> {
        try {
            const stat = await Deno.stat(ruta);
            return stat.isDirectory;
        } catch {
            return false;
        }
    }

    private async crearDirectorio(ruta: string): Promise<void> {
        try {
            await Deno.mkdir(ruta, { recursive: true });
        } catch (error) {
            if (!(error instanceof Deno.errors.AlreadyExists)) {
                throw error;
            }
        }
    }

    private async crearCarpetaProducto(idProducto: number): Promise<string> {
        try {
            if (!(await this.existeDirectorio(this.UPLOADS_DIR))) {
                await this.crearDirectorio(this.UPLOADS_DIR);
            }

            const productDir = join(this.UPLOADS_DIR, idProducto.toString());
            if (!(await this.existeDirectorio(productDir))) {
                await this.crearDirectorio(productDir);
            }

            return productDir;
        } catch (error) {
            console.error(`Error al crear carpeta para producto`, error);
            throw new Error("Error al crear directorio para la imagen.");
        }
    }

    private async eliminarCarpetaProducto(idProducto: number): Promise<void> {
        try {
            const productDir = join(this.UPLOADS_DIR, idProducto.toString());
            
            if (await this.existeDirectorio(productDir)) {
                await Deno.remove(productDir, { recursive: true });
            }

            if (await this.existeDirectorio(this.UPLOADS_DIR)) {
                try {
                    const items = [];
                    for await (const dirEntry of Deno.readDir(this.UPLOADS_DIR)) {
                        items.push(dirEntry);
                    }
                    if (items.length === 0) {
                        await Deno.remove(this.UPLOADS_DIR);
                    }
                } catch (readError) {
                    console.log("Directorio uploads ya no existe o esta vacio");
                }
            }
        } catch (error) {
            console.error(`Error al eliminar carpeta para producto`, error);
        }
    }

    private detectarTipoImagen(imagenData: string): string {

      if (imagenData.startsWith('data:image/')) {
            const match = imagenData.match(/data:image\/([^;]+)/);
            return match ? match[1] : 'jpg';
        }
        

        if (imagenData.startsWith('http://') || imagenData.startsWith('https://') || imagenData.startsWith('file://')) {
            const url = new URL(imagenData);
            const pathname = url.pathname.toLowerCase();
            if (pathname.includes('.png')) return 'png';
            if (pathname.includes('.jpg') || pathname.includes('.jpeg')) return 'jpg';
            if (pathname.includes('.gif')) return 'gif';
            if (pathname.includes('.webp')) return 'webp';
            if (pathname.includes('.bmp')) return 'bmp';
            if (pathname.includes('.svg')) return 'svg';
            return 'jpg';
        }
        
        return 'jpg';
    }

    private async procesarImagen(imagenData: string): Promise<Uint8Array> {
        try {
            console.log(`Procesando imagen - Entrada: ${imagenData.substring(0, 50)}...`);
            
            if (imagenData.startsWith('data:image/')) {
                const base64Data = imagenData.split(',')[1];
                if (!base64Data) {
                    throw new Error("Datos base64 invalidos despues del prefijo data:image/");
                }
                return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            }
            
            if (imagenData.startsWith('file://')) {
                let rutaArchivo = imagenData.replace('file://', '');
                
                if (rutaArchivo.startsWith('/') && rutaArchivo.match(/^\/[A-Za-z]:/)) {
                    rutaArchivo = rutaArchivo.substring(1);
                }
                                
                try {
                    const stat = await Deno.stat(rutaArchivo);
                    if (!stat.isFile) {
                        throw new Error(`La ruta no es un archivo valido: ${rutaArchivo}`);
                    }
                    
                    const fileData = await Deno.readFile(rutaArchivo);
                    return fileData;
                } catch (error) {
                    console.error(`Error al leer archivo`, error);
                    throw new Error(`No se pudo leer el archivo: ${rutaArchivo}. Verifica que el archivo existe y tienes permisos de lectura.`);
                }
            }
            
            if (imagenData.startsWith('http://') || imagenData.startsWith('https://')) {
                const response = await fetch(imagenData);
                if (!response.ok) {
                    throw new Error(`Error al descargar imagen: ${response.status} - ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            }
            
            if (imagenData.match(/^[A-Za-z0-9+/]+=*$/)) {
                try {
                    return Uint8Array.from(atob(imagenData), c => c.charCodeAt(0));
                } catch (error) {
                    throw new Error("El texto parece ser base64 pero no se puede decodificar correctamente");
                }
            }
            
            throw new Error(`Formato de imagen no reconocido. Recibido: ${imagenData.substring(0, 100)}`);
            
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Error desconocido al procesar la imagen");
        }
    }

    private async guardarImagen(idProducto: number, imagenData: string): Promise<string> {
        try {
            
            const productDir = await this.crearCarpetaProducto(idProducto);
            
            const timestamp = Date.now();
            const extension = this.detectarTipoImagen(imagenData);
            const nombreArchivo = `imagen_${timestamp}.${extension}`;
            const rutaCompleta = join(productDir, nombreArchivo);

            console.log(`Guardando imagen como: ${rutaCompleta}`);

            const dataToWrite = await this.procesarImagen(imagenData);
                        
            await Deno.writeFile(rutaCompleta, dataToWrite);
            
            console.log(`Imagen guardada exitosamente`);
            
            return join("uploads", idProducto.toString(), nombreArchivo);
        } catch (error) {
            console.error("Error al guardar imagen:", error);
            throw new Error("Error al guardar la imagen: " + (error instanceof Error ? error.message : "Error desconocido"));
        }
    }
}