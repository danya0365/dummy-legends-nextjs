export interface BasicRuleInfo {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

export interface RuleHighlight {
  id: string;
  title: string;
  description: string;
  examples?: string[];
  extraNotes?: string;
}

export interface ScoringRule {
  id: string;
  title: string;
  description: string;
  points: string;
  note?: string;
}

export interface StrategicTip {
  id: string;
  title: string;
  description: string;
}

interface ScoringSection {
  positive: ScoringRule[];
  negative: ScoringRule[];
}

export interface DummyRulesContent {
  hero: {
    title: string;
    subtitle: string;
    intro: string;
  };
  basics: BasicRuleInfo[];
  gameplay: {
    overview: string;
    steps: string[];
    victoryConditions: string[];
  };
  highlights: RuleHighlight[];
  scoring: ScoringSection;
  cardPoints: CardPointGroup[];
  strategicTips: StrategicTip[];
  closingRemark: string;
}

export interface CardPointGroup {
  id: string;
  title: string;
  points: string;
  cards: string[];
  description?: string;
  highlight?: boolean;
}

export const DUMMY_RULES_CONTENT: DummyRulesContent = {
  hero: {
    title: "กฎ กติกาเกมไพ่ดัมมี่ (Dummy Legends)",
    subtitle: "เข้าใจกติกาง่ายๆ พร้อมเคล็ดลับการเล่นให้สนุกและได้แต้มสูง",
    intro:
      "เกมไพ่ดัมมี่เป็นเกมวัดกึ๋นที่ต้องใช้ทั้งความจำ การคำนวณ และการอ่านใจคู่ต่อสู้ ใครจัดการไพ่และแต้มได้ดีกว่า ก็จะเป็นผู้คว้าชัยในวงไพ่ Dummy Legends",
  },
  basics: [
    {
      id: "players",
      label: "จำนวนผู้เล่น",
      value: "4 คน (มาตรฐาน)",
      highlight: true,
    },
    {
      id: "cards",
      label: "จำนวนไพ่เริ่มต้น",
      value: "คนละ 7 ใบ",
    },
    {
      id: "drawOptions",
      label: "ตัวเลือกในแต่ละตา",
      value: "จั่วไพ่จากกองกลาง หรือเก็บไพ่ที่คนอื่นทิ้ง",
    },
    {
      id: "objective",
      label: "เป้าหมาย",
      value: "เกิดไพ่ เก็บแต้ม และป้องกันไม่ให้คนอื่นน็อกก่อน",
    },
  ],
  gameplay: {
    overview:
      "ในแต่ละรอบผู้เล่นจะต้องจั่วหรือเก็บไพ่ 1 ใบ จากนั้นจัดไพ่ในมือให้เป็นชุด ‘เรียง’ หรือ ‘ตอง’ และทิ้งไพ่ 1 ใบลงกองกลาง วนไปจนกว่าจะมีคน ‘น็อก’ หรือไพ่กองกลางหมด",
    steps: [
      "เลือกว่าจะจั่วไพ่ใหม่จากกองจั่ว หรือเก็บไพ่บนกองกลาง",
      "จัดไพ่ให้เกิดหรือฝากกับชุดที่มีอยู่ โดยใช้การเรียงหรือการตอง",
      "ทิ้งไพ่ 1 ใบลงกองกลาง พร้อมวางแผนไม่ให้คู่ต่อสู้ได้ไพ่สำคัญ",
      "วนรอบไปเรื่อยๆ จนกว่าจะมีผู้เล่นน็อกหรือไพ่ในกองกลางหมด",
    ],
    victoryConditions: [
      "น็อก – จัดไพ่หมดมือและทิ้งไพ่สุดท้ายได้ก่อน",
      "ไพ่กองกลางหมด – วัดแต้มจากการเกิด/ฝากทั้งหมด",
    ],
  },
  highlights: [
    {
      id: "melding",
      title: "การเกิด",
      description:
        "หยิบไพ่จากกองกลางอย่างน้อย 1 ใบมาจัดเข้าชุดเรียงหรือตองแล้ววางลง เพื่อเก็บแต้มของชุดนั้น",
      extraNotes:
        "ไพ่สเปโต (2♣ และ Q♠) เมื่อนำมาเกิดด้วยจะได้แต้มพิเศษสูงถึง +50",
    },
    {
      id: "spe-to",
      title: "เกิดหรือฝากสเปโต",
      description:
        "การนำไพ่สเปโต (2♣, Q♠) มาอยู่ในชุดที่เกิดหรือฝาก จะได้รับแต้มบวกพิเศษทันที",
      examples: [
        "ตัวอย่าง: ลง 2♦ + 2♠ + 2♣(สเปโต) = 2♦(+5) + 2♠(+5) + 2♣(+50)",
      ],
    },
    {
      id: "head",
      title: "เก็บหัว",
      description:
        "การเกิดโดยใช้ไพ่ใบบนสุดของกองกลาง (เรียกว่า ‘หัว’) มาประกอบชุด จะได้แต้มเพิ่ม +50 และถ้าหัวเป็นสเปโตจะได้ถึง +100",
    },
    {
      id: "deposit",
      title: "การฝาก",
      description:
        "เมื่อผู้เล่นเกิดแล้ว สามารถนำไพ่ที่เหลือในมือไปฝากเพิ่มกับชุดของตัวเองหรือของคนอื่น เพื่อสะสมแต้ม",
      examples: [
        "ถ้ากองมี 3♠ 4♠ 5♠ แล้วเราฝาก 2♠ และ 6♠ เราจะได้เพิ่มใบละ +5 แต้ม",
      ],
    },
    {
      id: "knock",
      title: "การน็อกและโบนัส",
      description:
        "ผู้เล่นที่จัดไพ่จนเหลือใบสุดท้ายแล้วทิ้งลงกลางโต๊ะจะถือว่าน็อก รับแต้มเพิ่มทันที +50 และจบเกม",
      extraNotes:
        "รูปแบบพิเศษอย่างน็อกมืด น็อกสี และน็อกมืดสี จะมีการคูณแต้มเพิ่ม",
    },
  ],
  scoring: {
    positive: [
      {
        id: "head-points",
        title: "ไพ่หัว",
        description: "เก็บหัวจากกองกลางและนำมาเกิด",
        points: "+50 แต้ม",
      },
      {
        id: "spe-to-meld",
        title: "เกิดและคว่ำสเปโต",
        description: "ใช้ 2♣ หรือ Q♠ ในการเกิด",
        points: "+50 แต้ม",
      },
      {
        id: "deposit-spe-to",
        title: "ฝากสเปโต",
        description: "ฝากไพ่สเปโตเข้าไปในชุดที่มีอยู่",
        points: "+50 แต้ม",
      },
      {
        id: "knock",
        title: "น็อก",
        description: "จัดไพ่หมดมือและทิ้งไพ่สุดท้าย",
        points: "+50 แต้มขึ้นไป",
        note: "แต้มรวมจากชุดไพ่ที่เกิดและฝากทั้งหมด",
      },
      {
        id: "dark-knock",
        title: "น็อกมืด",
        description: "น็อกโดยไม่เคยเกิดเลย",
        points: "+50 แต้ม x2",
      },
      {
        id: "color-knock",
        title: "น็อกสี",
        description: "น็อกด้วยไพ่ดอกเดียวกันทั้งหมด",
        points: "+50 แต้ม x2",
      },
      {
        id: "dark-color-knock",
        title: "น็อกมืดสี",
        description: "ไม่เคยเกิดและน็อกด้วยไพ่ดอกเดียวกันทั้งหมด",
        points: "+50 แต้ม x4",
      },
    ],
    negative: [
      {
        id: "dummy-discard",
        title: "ทิ้งมี่",
        description: "ทิ้งไพ่ที่คนอื่นนำไปเกิดได้ทันที",
        points: "-50 แต้ม",
      },
      {
        id: "head-discard",
        title: "ทิ้งปี้หัว",
        description: "ทิ้งไพ่ที่เกิดกับหัวแล้วผู้เล่นอื่นเกิดได้",
        points: "-50 แต้ม",
      },
      {
        id: "full-discard",
        title: "ทิ้งเต็ม",
        description: "ทิ้งไพ่ที่ทำให้คนอื่นเรียงหรือตองกับกองกลางได้",
        points: "-50 แต้ม",
      },
      {
        id: "spe-to-target",
        title: "ถูกฝากสเปโต",
        description: "ลงชุดที่คนอื่นฝากสเปโตได้",
        points: "-50 แต้ม",
      },
      {
        id: "foolish-discard",
        title: "ทิ้งโง่",
        description: "ทิ้งไพ่และคนถัดไปเก็บไปน็อก",
        points: "-50 แต้ม",
      },
      {
        id: "dark-lose",
        title: "ลบมืด",
        description: "ไม่เคยเกิดเลยแล้วโดนคนอื่นน็อกก่อน",
        points: "ติดลบ x2 ของแต้มตัวเอง",
      },
    ],
  },
  cardPoints: [
    {
      id: "spe-to",
      title: "สเปโต",
      points: "ใบละ 50 คะแนน",
      cards: ["2♣", "Q♠"],
      description: "ไพ่ตัวแทน (สเปโต) ที่มีคะแนนสูงสุด ใช้ได้ทั้งการเกิดและฝาก",
      highlight: true,
    },
    {
      id: "ace",
      title: "A (Ace)",
      points: "ใบละ 15 คะแนน",
      cards: ["A♣", "A♦", "A♥", "A♠"],
    },
    {
      id: "face",
      title: "ไพ่ 10, J, Q, K",
      points: "ใบละ 10 คะแนน",
      cards: ["10♣", "J♣", "Q♣", "K♣", "10♦", "J♦", "Q♦", "K♦", "10♥", "J♥", "Q♥", "K♥", "10♠", "J♠", "Q♠", "K♠"],
      description: "กลุ่มไพ่หน้าคนและ 10 ทุกดอกให้คะแนนเท่ากัน",
    },
    {
      id: "number",
      title: "ไพ่เลข 3-9",
      points: "ใบละ 5 คะแนน",
      cards: [
        "3♣",
        "4♣",
        "5♣",
        "6♣",
        "7♣",
        "8♣",
        "9♣",
        "3♦",
        "4♦",
        "5♦",
        "6♦",
        "7♦",
        "8♦",
        "9♦",
        "3♥",
        "4♥",
        "5♥",
        "6♥",
        "7♥",
        "8♥",
        "9♥",
        "3♠",
        "4♠",
        "5♠",
        "6♠",
        "7♠",
        "8♠",
        "9♠",
      ],
      description: "ไพ่หมายเลขกลาง (3-9) ทุกดอกจะได้คะแนนเท่ากัน",
    },
  ],
  strategicTips: [
    {
      id: "memory",
      title: "ฝึกจำไพ่",
      description: "จำว่าใครทิ้งอะไรออกมาบ้าง เพื่อลดโอกาสโยนไพ่ให้คู่ต่อสู้",
    },
    {
      id: "spe-to-guard",
      title: "ระวังไพ่สเปโต",
      description: "อย่าปล่อย 2♣ หรือ Q♠ ง่ายๆ เพราะให้แต้มสูง",
    },
    {
      id: "plan-ending",
      title: "วางแผนตอนท้าย",
      description: "เตรียมไพ่สำหรับน็อกหรือกันไม่ให้คนอื่นน็อกได้",
    },
    {
      id: "balance",
      title: "วัดดวงและวางกลยุทธ์",
      description:
        "ดัมมี่ผสมทั้งโชคและกลยุทธ์ วางแผนให้ยืดหยุ่นและสังเกตสถานการณ์ทุกตา",
    },
  ],
  closingRemark:
    "Dummy Legends ออกแบบให้เข้าใจกติกาดัมมี่ได้ง่าย ทั้งสำหรับมือใหม่และผู้เล่นระดับโปร หากพร้อมแล้ว ลองลงสนามจริงและพิสูจน์ไหวพริบของคุณได้เลย!",
};
