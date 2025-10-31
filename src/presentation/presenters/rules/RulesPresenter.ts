import { DUMMY_RULES_CONTENT, DummyRulesContent } from "@/src/data/master/rules";

export type RulesViewModel = DummyRulesContent;

/**
 * Presenter สำหรับหน้าแสดงกติกาไพ่ดัมมี่
 * ยึดตามหลัก Clean Architecture แยก business logic ออกจาก layer การแสดงผล
 */
export class RulesPresenter {
  async getViewModel(): Promise<RulesViewModel> {
    try {
      return DUMMY_RULES_CONTENT;
    } catch (error) {
      console.error("Error loading dummy rules content:", error);
      throw error;
    }
  }

  async generateMetadata() {
    try {
      const { hero } = DUMMY_RULES_CONTENT;
      return {
        title: hero.title,
        description:
          "สรุปกฎ กติกาไพ่ดัมมี่แบบครบถ้วน พร้อมแต้มบวก-ลบ และเคล็ดลับการเล่นสำหรับผู้เล่นทุกระดับ",
      };
    } catch (error) {
      console.error("Error generating dummy rules metadata:", error);
      throw error;
    }
  }
}

export class RulesPresenterFactory {
  static async createServer(): Promise<RulesPresenter> {
    return new RulesPresenter();
  }

  static createClient(): RulesPresenter {
    return new RulesPresenter();
  }
}
