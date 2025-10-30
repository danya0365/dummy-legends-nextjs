export interface Country {
  code: string;
  name: string;
  nameTh: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "TH", name: "Thailand", nameTh: "ไทย", flag: "🇹🇭" },
  { code: "US", name: "United States", nameTh: "สหรัฐอเมริกา", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", nameTh: "สหราชอาณาจักร", flag: "🇬🇧" },
  { code: "JP", name: "Japan", nameTh: "ญี่ปุ่น", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", nameTh: "เกาหลีใต้", flag: "🇰🇷" },
  { code: "CN", name: "China", nameTh: "จีน", flag: "🇨🇳" },
  { code: "VN", name: "Vietnam", nameTh: "เวียดนาม", flag: "🇻🇳" },
  { code: "SG", name: "Singapore", nameTh: "สิงคโปร์", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", nameTh: "มาเลเซีย", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", nameTh: "อินโดนีเซีย", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", nameTh: "ฟิลิปปินส์", flag: "🇵🇭" },
  { code: "IN", name: "India", nameTh: "อินเดีย", flag: "🇮🇳" },
  { code: "AU", name: "Australia", nameTh: "ออสเตรเลีย", flag: "🇦🇺" },
  { code: "DE", name: "Germany", nameTh: "เยอรมนี", flag: "🇩🇪" },
  { code: "FR", name: "France", nameTh: "ฝรั่งเศส", flag: "🇫🇷" },
  { code: "RU", name: "Russia", nameTh: "รัสเซีย", flag: "🇷🇺" },
  { code: "BR", name: "Brazil", nameTh: "บราซิล", flag: "🇧🇷" },
  { code: "CA", name: "Canada", nameTh: "แคนาดา", flag: "🇨🇦" },
  { code: "MX", name: "Mexico", nameTh: "เม็กซิโก", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", nameTh: "อาร์เจนตินา", flag: "🇦🇷" },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function getCountryName(code: string, language: "th" | "en" = "th"): string {
  const country = getCountryByCode(code);
  if (!country) return code;
  return language === "th" ? country.nameTh : country.name;
}
