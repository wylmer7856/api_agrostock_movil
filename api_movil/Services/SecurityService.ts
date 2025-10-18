import { encodeBase64Url, decodeBase64Url } from "../Dependencies/dependencias.ts";

/**
 * Servicio de seguridad para manejo de contraseñas y tokens
 */
export class SecurityService {
  // private readonly BCRYPT_ROUNDS = 12; // TODO: Implementar cuando se necesite

  /**
   * Genera un hash seguro de contraseña usando Web Crypto API
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // Crear un salt aleatorio
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Importar la clave para PBKDF2
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      // Derivar la clave usando PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000, // 100,000 iteraciones
          hash: 'SHA-256'
        },
        keyMaterial,
        256 // 256 bits
      );

      // Combinar salt y hash
      const combined = new Uint8Array(salt.length + derivedBits.byteLength);
      combined.set(salt);
      combined.set(new Uint8Array(derivedBits), salt.length);

      // Codificar en base64url
      return encodeBase64Url(combined.buffer);
    } catch (error) {
      console.error("Error al hashear contraseña:", error);
      throw new Error("Error al procesar contraseña");
    }
  }

  /**
   * Verifica una contraseña contra su hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Decodificar el hash
      const combined = decodeBase64Url(hash);
      
      // Extraer salt y hash
      const salt = combined.slice(0, 16);
      const storedHash = combined.slice(16);

      // Importar la clave para PBKDF2
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      // Derivar la clave usando el mismo salt
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      // Comparar hashes
      const derivedHash = new Uint8Array(derivedBits);
      
      // Comparación segura para evitar timing attacks
      if (derivedHash.length !== storedHash.length) {
        return false;
      }

      let isEqual = true;
      for (let i = 0; i < derivedHash.length; i++) {
        if (derivedHash[i] !== storedHash[i]) {
          isEqual = false;
        }
      }

      return isEqual;
    } catch (error) {
      console.error("Error al verificar contraseña:", error);
      return false;
    }
  }

  /**
   * Genera un token seguro aleatorio
   */
  generateSecureToken(length: number = 32): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return encodeBase64Url(bytes.buffer);
  }

  /**
   * Genera un código de verificación
   */
  generateVerificationCode(length: number = 6): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    let code = '';
    for (let i = 0; i < length; i++) {
      code += (bytes[i] % 10).toString();
    }
    return code;
  }

  /**
   * Valida la fortaleza de una contraseña
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Longitud mínima
    if (password.length < 8) {
      feedback.push("La contraseña debe tener al menos 8 caracteres");
    } else {
      score += 1;
    }

    // Longitud recomendada
    if (password.length >= 12) {
      score += 1;
    }

    // Contiene mayúsculas
    if (!/[A-Z]/.test(password)) {
      feedback.push("La contraseña debe contener al menos una letra mayúscula");
    } else {
      score += 1;
    }

    // Contiene minúsculas
    if (!/[a-z]/.test(password)) {
      feedback.push("La contraseña debe contener al menos una letra minúscula");
    } else {
      score += 1;
    }

    // Contiene números
    if (!/\d/.test(password)) {
      feedback.push("La contraseña debe contener al menos un número");
    } else {
      score += 1;
    }

    // Contiene caracteres especiales
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push("La contraseña debe contener al menos un carácter especial");
    } else {
      score += 1;
    }

    // No contiene patrones comunes
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      feedback.push("La contraseña contiene patrones comunes inseguros");
      score -= 2;
    }

    // No contiene información personal común
    const personalInfo = [
      /nombre/i,
      /apellido/i,
      /email/i,
      /telefono/i,
      /fecha/i
    ];

    if (personalInfo.some(pattern => pattern.test(password))) {
      feedback.push("La contraseña no debe contener información personal");
      score -= 1;
    }

    const isValid = score >= 4 && feedback.length === 0;

    return {
      isValid,
      score: Math.max(0, Math.min(5, score)),
      feedback
    };
  }

  /**
   * Genera un hash para verificación de email
   */
  async generateEmailVerificationHash(email: string): Promise<string> {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const data = `${email}:${timestamp}:${encodeBase64Url(randomBytes.buffer)}`;
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    return encodeBase64Url(new Uint8Array(hashBuffer).buffer);
  }

  /**
   * Valida un hash de verificación de email
   */
  async validateEmailVerificationHash(email: string, hash: string): Promise<boolean> {
    try {
      // En un sistema real, almacenarías el hash con timestamp
      // y verificarías que no haya expirado (ej: 24 horas)
      const generatedHash = await this.generateEmailVerificationHash(email);
      return generatedHash === hash;
    } catch (error) {
      console.error("Error al validar hash de email:", error);
      return false;
    }
  }

  /**
   * Genera un token de recuperación de contraseña
   */
  generatePasswordResetToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const data = `${timestamp}:${encodeBase64Url(randomBytes.buffer)}`;
    
    const encodedData = new TextEncoder().encode(data);
    return encodeBase64Url(encodedData.buffer as ArrayBuffer);
  }

  /**
   * Valida un token de recuperación de contraseña
   */
  validatePasswordResetToken(token: string, maxAgeHours: number = 24): boolean {
    try {
      const decoded = new TextDecoder().decode(decodeBase64Url(token));
      const [timestamp] = decoded.split(':');
      
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convertir a milisegundos
      
      return (now - tokenTime) <= maxAge;
    } catch (error) {
      console.error("Error al validar token de recuperación:", error);
      return false;
    }
  }

  /**
   * Sanitiza datos de entrada para prevenir XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remover < y >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }

  /**
   * Valida formato de email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Valida formato de teléfono colombiano
   */
  validatePhone(phone: string): boolean {
    // Formato colombiano: +57, 57, o sin código de país
    const phoneRegex = /^(\+?57)?[1-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Genera un ID único para sesiones
   */
  generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = encodeBase64Url(randomBytes.buffer).replace(/[^a-zA-Z0-9]/g, '');
    
    return `sess_${timestamp}_${randomString}`.substring(0, 32);
  }

  /**
   * Valida que un string no contenga caracteres peligrosos
   */
  validateSafeString(input: string, maxLength: number = 255): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = input;

    // Longitud
    if (input.length > maxLength) {
      errors.push(`El texto no puede exceder ${maxLength} caracteres`);
      sanitized = input.substring(0, maxLength);
    }

    // Caracteres peligrosos
    const dangerousChars = /[<>'"&]/g;
    if (dangerousChars.test(input)) {
      errors.push("El texto contiene caracteres no permitidos");
      sanitized = sanitized.replace(dangerousChars, '');
    }

    // Scripts
    const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (scriptPattern.test(input)) {
      errors.push("El texto contiene código JavaScript no permitido");
      sanitized = sanitized.replace(scriptPattern, '');
    }

    return {
      isValid: errors.length === 0,
      sanitized: sanitized.trim(),
      errors
    };
  }
}

export const securityService = new SecurityService();
