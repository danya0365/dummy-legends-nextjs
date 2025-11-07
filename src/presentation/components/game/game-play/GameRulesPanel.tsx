"use client";

import {
  AlertCircle,
  Award,
  BookOpen,
  Coins,
  Flame,
  HandCoins,
  Shield,
  Sparkles,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface GameRulesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameRulesPanel({ isOpen, onClose }: GameRulesPanelProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "bonus" | "penalty">(
    "basic"
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              กติกาเกมไพ่ดัมมี่
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "basic"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span>กติกาพื้นฐาน</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("bonus")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "bonus"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              <span>โบนัส</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("penalty")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "penalty"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>โทษ</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "basic" && <BasicRulesContent />}
          {activeTab === "bonus" && <BonusRulesContent />}
          {activeTab === "penalty" && <PenaltyRulesContent />}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}

function BasicRulesContent() {
  return (
    <div className="space-y-4">
      <RuleSection
        icon={<HandCoins className="w-5 h-5 text-blue-500" />}
        title="การเกิดไพ่ (Meld)"
        description="หยิบไพ่จากกองกลางอย่างน้อย 1 ใบ แล้วจัดเป็นชุดเรียงหรือชุดตองเพื่อนำมาวางทำแต้ม"
        items={[
          "ชุดเรียง: ไพ่ดอกเดียวกันเรียงลำดับกัน (เช่น ♠️3 ♠️4 ♠️5)",
          "ชุดตอง: ไพ่หน้าเดียวกัน 3 ใบขึ้นไป (เช่น ♥️Q ♦️Q ♣️Q)",
          "หากชุดมีสเปโต (2♣ หรือ Q♠) จะได้แต้มเพิ่ม +50",
        ]}
      />

      <RuleSection
        icon={<HandCoins className="w-5 h-5 text-indigo-500" />}
        title="การเก็บไพ่จากกองทิ้ง"
        description="เลือกไพ่ใบใดก็ได้ในกองทิ้งแทนการจั่ว แล้วเก็บไพ่ตั้งแต่ใบบนสุดลงมาถึงใบเป้าหมายขึ้นมือ เพื่อใช้เกิดทันทีในเทิร์นเดียว"
        items={[
          "ต้องเกิดสำเร็จทันทีหลังเก็บ ไม่เช่นนั้นจะไม่สามารถหยิบกองทิ้งได้",
          "ช่วยเติมชุดเรียง/ตอง หรือกันไม่ให้คู่แข่งได้ไพ่ใบสำคัญ",
          "ไพ่ที่เก็บทั้งหมดจะเข้าสู่มือก่อนนำไปจัดชุด",
        ]}
      />

      <RuleSection
        icon={<Sparkles className="w-5 h-5 text-amber-500" />}
        title="การเก็บหัว (Head)"
        description="หัวคือไพ่ใบบนสุดของกองทิ้ง หากเก็บมาเกิดสำเร็จจะได้รับโบนัสพิเศษ"
        items={[
          "เก็บหัวแล้วเกิดชุด รับโบนัส +50 แต้ม",
          "หัวเป็นสเปโต (2♣ หรือ Q♠) รับโบนัสเพิ่มเติม +50 แต้ม",
          "ระวังอย่าทิ้งไพ่ที่ทำให้คู่แข่งเก็บหัวได้ง่าย",
        ]}
      />

      <RuleSection
        icon={<Coins className="w-5 h-5 text-green-500" />}
        title="การฝากไพ่ (Layoff)"
        description="หลังจากเกิดแล้ว สามารถนำไพ่ในมือไปฝากเติมกับชุดที่เปิดอยู่เพื่อลดแต้มในมือ"
        items={[
          "ฝากต่อยอดได้ทั้งกองของเราเองและของผู้เล่นอื่น",
          "ตัวอย่าง: 3♠ 4♠ 5♠ → ฝาก 2♠ หรือ 6♠ เพื่อได้แต้มเพิ่ม",
          "ฝากสเปโต (2♣ หรือ Q♠) จะได้แต้มพิเศษ +50",
        ]}
      />

      <RuleSection
        icon={<Zap className="w-5 h-5 text-yellow-500" />}
        title="การน็อก (Knock)"
        description="จัดไพ่จนเหลือใบสุดท้ายเพียง 1 ใบแล้วทิ้ง ถือว่าน็อกและได้รับแต้มโบนัส"
        items={[
          "เมื่อไพ่วนครบเทิร์น สามารถเลือกน็อกได้ถ้าเหลือไพ่ใบเดียว",
          "การน็อกให้โบนัส +50 แต้ม",
          "หากกองจั่วหมด ผู้ที่จั่วใบสุดท้ายและส่งต่อโดยไม่มีใครน็อกได้ จะได้ +50 แต้ม",
        ]}
      />
    </div>
  );
}

function BonusRulesContent() {
  return (
    <div className="space-y-4">
      <RuleSection
        icon={<Sparkles className="w-5 h-5 text-purple-500" />}
        title="สเปโต (Speto)"
        description="ไพ่พิเศษ 2♣ หรือ Q♠ ใช้แทนไพ่ใบใดก็ได้และให้แต้มบวกเพิ่ม"
        items={[
          "เกิดชุดที่มีสเปโต รับเพิ่ม +50 แต้ม",
          "ฝากสเปโตกับกองที่เปิดอยู่ รับเพิ่ม +50 แต้ม",
          "หากสเปโตเป็นหัว จะได้ถึง +100 แต้ม",
        ]}
        bonus="+50 / +100 แต้ม"
      />

      <RuleSection
        icon={<Zap className="w-5 h-5 text-yellow-500" />}
        title="การน็อก"
        description="การน็อกปกติจะให้ +50 แต้ม และยังเป็นเงื่อนไขสำคัญของโบนัสอื่น"
        items={[
          "น็อกเมื่อจัดไพ่ครบและเหลือใบสุดท้ายไว้ทิ้ง",
          "การน็อกทุกครั้งจะให้แต้มพื้นฐาน +50",
          "น็อกพิเศษ (มืด/สี/มืดสี) จะคูณแต้มรวมเพิ่มเติม",
        ]}
        bonus="+50 แต้ม"
      />

      <RuleSection
        icon={<Flame className="w-5 h-5 text-orange-500" />}
        title="น็อกมืด (Dark Knock)"
        description="ไม่เคยเกิดไพ่เลยตลอดรอบ แต่สามารถน็อกได้สำเร็จ"
        items={[
          "รับแต้มพื้นฐาน +50",
          "คูณแต้มรวมทั้งหมดของรอบเป็น x2",
          "ต้องบริหารไพ่ให้ไม่ต้องเกิดก่อน",
        ]}
        bonus="คูณ x2"
      />

      <RuleSection
        icon={<Award className="w-5 h-5 text-blue-500" />}
        title="น็อกสี (Color Knock)"
        description="น็อกโดยที่ไพ่ที่เกิดและฝากทั้งหมดเป็นดอกเดียวกัน"
        items={[
          "รับแต้มพื้นฐาน +50",
          "คูณแต้มรวมทั้งหมดของรอบเป็น x2",
          "ต้องรักษาสีของทุกชุดให้เป็นดอกเดียวกัน",
        ]}
        bonus="คูณ x2"
      />

      <RuleSection
        icon={<Award className="w-5 h-5 text-yellow-500" />}
        title="น็อกมืดสี (Dark Color Knock)"
        description="รวมเงื่อนไขทั้งไม่เคยเกิดและใช้ไพ่ดอกเดียวกันทั้งหมด"
        items={[
          "รับแต้มพื้นฐาน +50",
          "คูณแต้มรวมทั้งหมดของรอบเป็น x4",
          "เป็นเงื่อนไขที่ได้คะแนนสูงสุดในเกม",
        ]}
        bonus="คูณ x4"
      />
    </div>
  );
}

function PenaltyRulesContent() {
  return (
    <div className="space-y-4">
      <RuleSection
        icon={<TrendingDown className="w-5 h-5 text-red-500" />}
        title="ลบมืด (Dark Lose)"
        description="ผู้เล่นที่ไม่เคยเกิดแล้วถูกน็อกก่อน จะคูณแต้มลบของตัวเอง x2"
        items={[
          "เกิดขึ้นเมื่อไม่ได้เปิดชุดใดเลยตลอดรอบ",
          "แต้มลบทั้งหมดของผู้เล่นคูณสอง",
          "ป้องกันได้ด้วยการเกิดอย่างน้อย 1 กอง",
        ]}
        penalty="แต้มลบ x2"
      />

      <RuleSection
        icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
        title="ทิ้งมี่ (Discard Meld)"
        description="ทิ้งไพ่แล้วผู้เล่นถัดไปสามารถเก็บไปเกิดได้ทันที"
        items={[
          "ต้องระวังไพ่ที่ทำให้ชุดของคู่แข่งสมบูรณ์",
          "เมื่อเกิดเหตุจะโดนหัก -50 แต้ม",
          "ระบบจะเตือนก่อนทิ้ง",
        ]}
        penalty="-50 แต้ม"
      />

      <RuleSection
        icon={<AlertCircle className="w-5 h-5 text-red-500" />}
        title="ทิ้งปี้หัว (Discard Head)"
        description="ทิ้งไพ่ที่ทำให้ผู้เล่นถัดไปเก็บหัวรวมกับชุดได้"
        items={[
          "หัวคือไพ่ใบบนสุดของกองกลาง",
          "หากผู้เล่นถัดไปนำไพ่ที่เราทิ้งไปเกิดร่วมกับหัวได้ เราจะโดนโทษ",
          "ถูกหัก -50 แต้ม",
        ]}
        penalty="-50 แต้ม"
      />

      <RuleSection
        icon={<AlertCircle className="w-5 h-5 text-red-600" />}
        title="ทิ้งเต็ม (Discard Full)"
        description="ทิ้งไพ่ที่ทำให้คู่แข่งสามารถจัดชุดเรียงหรือตองกับกองกลางได้ครบในทันที"
        items={[
          "มักเกิดเมื่อเหลือไพ่ที่เข้าคู่กับชุดบนโต๊ะ",
          "ช่วยให้คู่แข่งทำแต้มบวกจำนวนมาก",
          "ถูกหัก -50 แต้ม",
        ]}
        penalty="-50 แต้ม"
      />

      <RuleSection
        icon={<AlertCircle className="w-5 h-5 text-yellow-600" />}
        title="ทิ้งโง่ (Foolish Discard)"
        description="ทิ้งไพ่แล้วผู้เล่นถัดไปเก็บไปน็อกได้ทันที"
        items={[
          "มักเกิดเมื่อคู่แข่งเหลือไพ่น้อย",
          "ควรจำไพ่ที่คู่แข่งต้องการ",
          "ถูกหัก -50 แต้ม",
        ]}
        penalty="-50 แต้ม"
      />

      <RuleSection
        icon={<TrendingDown className="w-5 h-5 text-purple-600" />}
        title="ถูกฝากสเปโต"
        description="เปิดชุดที่เปิดโอกาสให้คนอื่นฝากสเปโต (2♣ หรือ Q♠) ลงในกองของเรา"
        items={[
          "เมื่อมีคนฝากสเปโตในกองเราจะโดนหักคะแนน",
          "เกิดขึ้นได้แม้พยายามป้องกัน เพราะขึ้นกับไพ่ของคู่แข่ง",
          "ถูกหัก -50 แต้ม",
        ]}
        penalty="-50 แต้ม"
      />
    </div>
  );
}

interface RuleSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
  bonus?: string;
  penalty?: string;
}

function RuleSection({
  icon,
  title,
  description,
  items,
  bonus,
  penalty,
}: RuleSectionProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-2">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {bonus && (
              <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                {bonus}
              </span>
            )}
            {penalty && (
              <span className="text-xs font-medium px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                {penalty}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {description}
          </p>
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
              >
                <span className="text-blue-500 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
