/**
 * Text Helper Functions
 * ฟังก์ชันช่วยเหลือสำหรับการจัดการข้อความ
 */

/**
 * Truncate text to a specific length and add ellipsis
 * ตัดข้อความให้สั้นลงและเพิ่ม ...
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Truncate text by words instead of characters
 * ตัดข้อความตามจำนวนคำ
 */
export function truncateWords(text: string, maxWords: number): string {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Convert text to title case
 * แปลงข้อความเป็น Title Case
 */
export function toTitleCase(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Remove HTML tags from text
 * ลบ HTML tags ออกจากข้อความ
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Capitalize first letter
 * ทำตัวอักษรตัวแรกเป็นตัวใหญ่
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format number with Thai number format
 * จัดรูปแบบตัวเลขแบบไทย (คั่นด้วยคอมม่า)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("th-TH").format(num);
}

/**
 * Format currency in Thai Baht
 * จัดรูปแบบเงินเป็นบาท
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
}

/**
 * Extract mentions from text (@username)
 * ดึง mentions ออกจากข้อความ
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}

/**
 * Extract hashtags from text (#hashtag)
 * ดึง hashtags ออกจากข้อความ
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  return hashtags;
}

/**
 * Create excerpt from text
 * สร้างข้อความย่อจากข้อความเต็ม
 */
export function createExcerpt(
  text: string,
  maxLength: number = 160
): string {
  const cleanText = stripHtml(text);
  return truncate(cleanText, maxLength);
}

/**
 * Slugify text for URLs
 * แปลงข้อความเป็น URL slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
