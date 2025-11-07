"use client";

import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

interface TooltipContent {
  title: string;
  description: string;
  examples?: string[];
}

interface GameRuleTooltipProps {
  content: TooltipContent;
  position?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md" | "lg";
}

export function GameRuleTooltip({
  content,
  position = "top",
  size = "md",
}: GameRuleTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-700",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800 dark:border-b-gray-700",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800 dark:border-l-gray-700",
    right:
      "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800 dark:border-r-gray-700",
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        aria-label="ดูข้อมูลเพิ่มเติม"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div
          className={`absolute z-50 ${positionClasses[position]} ${sizeClasses[size]} animate-in fade-in zoom-in duration-200`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />

          {/* Content */}
          <div className="bg-gray-800 dark:bg-gray-700 text-white rounded-lg shadow-xl p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm">{content.title}</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-200 dark:text-gray-300 mb-2">
              {content.description}
            </p>

            {content.examples && content.examples.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700 dark:border-gray-600">
                <p className="text-xs font-medium text-gray-300 mb-1">
                  ตัวอย่าง:
                </p>
                <ul className="text-xs text-gray-300 space-y-1">
                  {content.examples.map((example, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-400 shrink-0">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Predefined tooltip contents for common game rules
export const GAME_RULE_TOOLTIPS = {
  meld: {
    title: "การเกิดไพ่",
    description:
      "เกิดได้ทั้งจากการเก็บไพ่บนกองกลางมารวมกับไพ่ในมือ หรือใช้เฉพาะไพ่บนมือที่จัดครบชุดด้วยตัวเอง",
    examples: [
      "เกิดจากกองกลาง: เก็บหัว ♥️9 รวมกับ ♥️10 ♣️J ในมือ",
      "เกิดจากไพ่บนมือ: ♠️3 ♠️4 ♠️5",
      "ชุดที่มีสเปโต (2♣ หรือ Q♠) จะได้เพิ่ม +50 แต้ม",
    ],
  },
  layoff: {
    title: "การฝากไพ่",
    description:
      "หลังจากเกิดแล้ว สามารถนำไพ่ที่เหลือไปต่อยอดกับชุดของเราเองหรือของผู้อื่นเพื่อลดแต้มในมือ",
    examples: [
      "ฝากต่อท้าย: 3♠ 4♠ 5♠ → ฝาก 6♠",
      "เติมตอง: ♥️K ♦️K → ฝาก ♣️K",
      "ฝากสเปโต (2♣ หรือ Q♠) รับ +50 แต้มทันที",
    ],
  },
  knock: {
    title: "การน็อก",
    description:
      "จัดไพ่จนเหลือใบสุดท้ายเพียง 1 ใบแล้วทิ้ง ถือว่าน็อกและได้รับ +50 แต้ม",
    examples: [
      "จัดชุดครบ เหลือไพ่ 1 ใบไว้ทิ้ง",
      "น็อกหลังจั่วใบสุดท้ายเมื่อกองจั่วหมด",
      "การน็อกพิเศษจะได้ตัวคูณคะแนนเพิ่มเติม",
    ],
  },
  darkLose: {
    title: "ลบมืด (Dark Lose)",
    description:
      "ผู้เล่นที่ไม่เคยเกิดไพ่เลยในรอบนั้นและถูกน็อกก่อน จะคูณแต้มลบของตนเอง x2",
    examples: [
      "ไม่เคยเกิดไพ่ + ถูกน็อก = แต้มลบคูณสอง",
      "ป้องกันได้ด้วยการเกิดไพ่อย่างน้อย 1 กอง",
    ],
  },
  discardPenalty: {
    title: "โทษการทิ้งไพ่",
    description:
      "ทิ้งไพ่ที่เปิดโอกาสให้ผู้เล่นถัดไปเกิดหรือน็อก จะถูกหัก -50 แต้ม",
    examples: [
      "ทิ้งมี่: คนถัดไปเกิดได้ทันที (-50)",
      "ทิ้งปี้หัว: เปิดโอกาสให้เกิดรวมกับหัว (-50)",
      "ทิ้งเต็ม: ทำให้ครบชุดในกองกลาง (-50)",
      "ทิ้งโง่: คนถัดไปเก็บไปน็อก (-50)",
    ],
  },
  discardPickup: {
    title: "การเก็บไพ่จากกองทิ้ง",
    description:
      "เลือกไพ่ใบใดก็ได้ในกองทิ้งแทนการจั่ว จากนั้นเก็บไพ่ตั้งแต่ใบบนสุดลงมาถึงใบที่เลือกขึ้นมือ แล้วต้องใช้ร่วมกับไพ่ในมือเพื่อเกิดให้เสร็จในเทิร์นนั้น",
    examples: [
      "เลือกเก็บไพ่กลางกองเพราะจะทำให้ครบชุดเรียง/ตอง แล้วต้องหยิบไพ่เหนือมันทั้งหมดขึ้นมือ",
      "หากเก็บแล้วจัดชุดไม่ครบ ระบบจะไม่ยอมให้เก็บ ต้องกลับไปจั่วจากกองจั่ว",
      "ใช้เพื่อกันไม่ให้คู่แข่งได้ไพ่ใบสำคัญ หรือเติมชุดของเราให้สมบูรณ์",
    ],
  },
  spetoBonus: {
    title: "โบนัสสเปโต",
    description: "สเปโตคือไพ่ 2♣ หรือ Q♠ ใช้แทนไพ่ใบใดก็ได้และให้แต้มพิเศษ",
    examples: [
      "เกิดชุดที่มีสเปโต รับ +50 แต้ม",
      "ฝากสเปโตกับกองที่เปิดอยู่ รับ +50 แต้ม",
      "ระวังถูกฝากสเปโตใส่กองเรา (-50 แต้ม)",
    ],
  },
  headBonus: {
    title: "โบนัสหัว",
    description:
      "เก็บไพ่ใบบนสุดของกองทิ้ง (หัว) มารวมในชุดที่เกิดสำเร็จ จะได้โบนัสพิเศษ +50 แต้ม",
    examples: [
      "เก็บหัว ♥️9 มารวมกับ ♥️10 ♣️J แล้วเกิด รับ +50 แต้ม",
      "ถ้าในชุดเดียวกันมีสเปโต (2♣ หรือ Q♠) จะได้โบนัสสเปโตเพิ่มอีก +50 แต้ม",
      "ควรระวังไม่ทิ้งไพ่ที่เปิดโอกาสให้คู่แข่งเก็บหัวได้",
    ],
  },
  validation: {
    title: "การตรวจสอบกติกา",
    description:
      "ระบบเตือนเมื่อคุณพยายามทำการเล่นที่ผิดกติกาหรือเสี่ยงโดนโทษ",
    examples: [
      "ห้ามทิ้งไพ่ที่คนถัดไปเกิดได้ทันที",
      "ต้องเกิดอย่างน้อย 1 กองก่อนน็อก",
      "เลือกบังคับทิ้งได้เมื่อยอมรับความเสี่ยง",
    ],
  },
};
