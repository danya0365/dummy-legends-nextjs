/**
 * Image Helper Functions
 * ฟังก์ชันช่วยเหลือสำหรับการจัดการรูปภาพ
 */

/**
 * Get optimized image URL with width and quality
 * ได้ URL รูปภาพที่ optimize แล้ว
 */
export function getOptimizedImageUrl(
  url: string,
  _width?: number,
  _quality?: number
): string {
  if (!url) return "";

  // If it's a local image or already optimized, return as is
  if (url.startsWith("/") || url.includes("_next/image")) {
    return url;
  }

  // For external images, you might want to use an image optimization service
  // This is a placeholder - replace with your actual service
  // In the future, you can use width and quality parameters here
  return url;
}

/**
 * Get placeholder image URL
 * ได้ URL รูปภาพ placeholder
 */
export function getPlaceholderImage(width: number = 400, height: number = 400): string {
  return `https://via.placeholder.com/${width}x${height}`;
}

/**
 * Get user avatar fallback
 * ได้รูป avatar สำรอง
 */
export function getUserAvatarFallback(name: string): string {
  if (!name) return getPlaceholderImage(200, 200);
  
  // Generate a color based on the name
  const colors = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-orange-500 to-red-600",
    "from-indigo-500 to-blue-600",
    "from-purple-500 to-pink-600",
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

/**
 * Validate image file type
 * ตรวจสอบประเภทไฟล์รูปภาพ
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  return validTypes.includes(file.type);
}

/**
 * Validate image file size (in MB)
 * ตรวจสอบขนาดไฟล์รูปภาพ
 */
export function isValidImageSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Get image dimensions from file
 * ได้ขนาดรูปภาพจากไฟล์
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Compress image file
 * บีบอัดไฟล์รูปภาพ
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Convert image to base64
 * แปลงรูปภาพเป็น base64
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert image to base64"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get file extension from filename
 * ได้ extension ไฟล์
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Generate unique filename
 * สร้างชื่อไฟล์ที่ไม่ซ้ำ
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = getFileExtension(originalFilename);
  return `${timestamp}-${random}.${extension}`;
}
