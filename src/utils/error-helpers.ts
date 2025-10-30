/**
 * Error Helper Functions
 * ฟังก์ชันช่วยเหลือสำหรับการจัดการข้อผิดพลาด
 */

/**
 * Get error message from unknown error type
 * ดึงข้อความ error จากประเภทใดก็ได้
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
}

/**
 * Check if error is network error
 * ตรวจสอบว่าเป็น error จากเครือข่ายหรือไม่
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("fetch") ||
      error.message.includes("timeout") ||
      error.name === "NetworkError"
    );
  }
  return false;
}

/**
 * Check if error is authentication error
 * ตรวจสอบว่าเป็น error จาก authentication หรือไม่
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("unauthorized") ||
      error.message.includes("authentication") ||
      error.message.includes("401") ||
      error.message.includes("403")
    );
  }
  return false;
}

/**
 * Check if error is validation error
 * ตรวจสอบว่าเป็น error จาก validation หรือไม่
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("validation") ||
      error.message.includes("invalid") ||
      error.message.includes("required") ||
      error.message.includes("400")
    );
  }
  return false;
}

/**
 * Format error for user display
 * จัดรูปแบบ error สำหรับแสดงให้ผู้ใช้
 */
export function formatErrorForUser(error: unknown): string {
  const message = getErrorMessage(error);

  // Translate common error messages to Thai
  const translations: Record<string, string> = {
    "Network error": "เกิดข้อผิดพลาดในการเชื่อมต่อ",
    "Not found": "ไม่พบข้อมูล",
    "Unauthorized": "กรุณาเข้าสู่ระบบ",
    "Forbidden": "คุณไม่มีสิทธิ์เข้าถึง",
    "Bad request": "ข้อมูลไม่ถูกต้อง",
    "Internal server error": "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์",
    "Timeout": "หมดเวลาการเชื่อมต่อ",
  };

  // Check if message contains any known error patterns
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
}

/**
 * Log error with additional context
 * บันทึก error พร้อมข้อมูลเพิ่มเติม
 */
export function logError(
  error: unknown,
  context?: {
    component?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = getErrorMessage(error);

  console.error("Error occurred:", {
    message,
    context,
    error,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
}

/**
 * Create custom error class
 * สร้าง error class แบบกำหนดเอง
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Handle API error response
 * จัดการ error response จาก API
 */
export function handleApiError(error: unknown): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // If it's a fetch error with response
  if (error instanceof Response) {
    return new AppError(
      `API Error: ${error.statusText}`,
      "API_ERROR",
      error.status
    );
  }

  // Generic error
  const message = getErrorMessage(error);
  return new AppError(message, "UNKNOWN_ERROR");
}

/**
 * Retry async function with exponential backoff
 * ลองเรียก function อีกครั้งโดยรอเวลาแบบ exponential
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wrap async function with error handling
 * ห่อ async function ด้วย error handling
 */
export function withErrorHandling<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  errorHandler?: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        logError(error, {
          action: fn.name,
        });
      }
      throw error;
    }
  }) as T;
}
