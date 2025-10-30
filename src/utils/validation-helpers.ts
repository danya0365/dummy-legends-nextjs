/**
 * Validation Helper Functions
 * ฟังก์ชันช่วยเหลือสำหรับการตรวจสอบความถูกต้องของข้อมูล
 */

/**
 * Validate email address
 * ตรวจสอบอีเมล
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * ตรวจสอบความแข็งแรงของรหัสผ่าน
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("รหัสผ่านต้องมีตัวเลข");
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push("รหัสผ่านต้องมีอักขระพิเศษ (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate URL
 * ตรวจสอบ URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (Thai format)
 * ตรวจสอบเบอร์โทรศัพท์ (รูปแบบไทย)
 */
export function isValidThaiPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleanPhone = phone.replace(/[\s-]/g, "");

  // Thai phone number patterns
  // Mobile: 06x, 08x, 09x (10 digits)
  // Landline: 0x-xxx-xxxx (9-10 digits)
  const phoneRegex = /^(0[689]{1}\d{8}|0[2-5]{1}\d{7,8})$/;

  return phoneRegex.test(cleanPhone);
}

/**
 * Validate username
 * ตรวจสอบชื่อผู้ใช้
 */
export function isValidUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (username.length < 3) {
    return {
      isValid: false,
      error: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร",
    };
  }

  if (username.length > 20) {
    return {
      isValid: false,
      error: "ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร",
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      error: "ชื่อผู้ใช้ต้องประกอบด้วยตัวอักษร ตัวเลข และ _ เท่านั้น",
    };
  }

  return { isValid: true };
}

/**
 * Validate age (must be 13+ for social media)
 * ตรวจสอบอายุ (ต้อง 13 ปีขึ้นไป)
 */
export function isValidAge(birthDate: Date | string): {
  isValid: boolean;
  age: number;
  error?: string;
} {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 13) {
    return {
      isValid: false,
      age,
      error: "ต้องมีอายุอย่างน้อย 13 ปีเพื่อใช้งาน",
    };
  }

  return { isValid: true, age };
}

/**
 * Sanitize input (prevent XSS)
 * ทำความสะอาด input เพื่อป้องกัน XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate file upload
 * ตรวจสอบไฟล์อัพโหลด
 */
export function isValidFileUpload(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): {
  isValid: boolean;
  error?: string;
} {
  const { maxSizeMB = 5, allowedTypes = ["image/*", "video/*"] } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `ไฟล์ต้องมีขนาดไม่เกิน ${maxSizeMB} MB`,
    };
  }

  // Check file type
  const isAllowedType = allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const category = type.split("/")[0];
      return file.type.startsWith(category + "/");
    }
    return file.type === type;
  });

  if (!isAllowedType) {
    return {
      isValid: false,
      error: "ประเภทไฟล์ไม่ได้รับอนุญาต",
    };
  }

  return { isValid: true };
}

/**
 * Validate credit card number (Luhn algorithm)
 * ตรวจสอบหมายเลขบัตรเครดิต
 */
export function isValidCreditCard(cardNumber: string): boolean {
  // Remove spaces and dashes
  const cleanNumber = cardNumber.replace(/[\s-]/g, "");

  // Check if it's all digits and has valid length
  if (!/^\d{13,19}$/.test(cleanNumber)) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate Thai ID card number
 * ตรวจสอบเลขบัตรประชาชน
 */
export function isValidThaiIdCard(idCard: string): boolean {
  // Remove spaces and dashes
  const cleanId = idCard.replace(/[\s-]/g, "");

  // Check length
  if (cleanId.length !== 13 || !/^\d{13}$/.test(cleanId)) {
    return false;
  }

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i)) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleanId.charAt(12));
}

/**
 * Check if string contains profanity (basic Thai words)
 * ตรวจสอบคำหยาบ (พื้นฐาน)
 */
export function containsProfanity(text: string): boolean {
  // This is a basic example - in production, use a proper profanity filter library
  const profanityList: string[] = [
    // Add your profanity words here
    // Example (censored): "bad*word", "another*bad*word"
  ];

  const lowerText = text.toLowerCase();
  return profanityList.some((word) => lowerText.includes(word));
}

/**
 * Validate post content length
 * ตรวจสอบความยาวของโพสต์
 */
export function isValidPostContent(content: string): {
  isValid: boolean;
  error?: string;
  length: number;
} {
  const trimmed = content.trim();
  const length = trimmed.length;

  if (length === 0) {
    return {
      isValid: false,
      error: "กรุณาใส่เนื้อหาโพสต์",
      length,
    };
  }

  if (length > 5000) {
    return {
      isValid: false,
      error: "เนื้อหาโพสต์ต้องไม่เกิน 5,000 ตัวอักษร",
      length,
    };
  }

  return { isValid: true, length };
}
