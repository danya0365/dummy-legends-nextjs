import { FEATURES, Feature } from "@/src/data/master/features";
import {
  landingMockData,
  LandingStats,
  FeaturedTournament,
  TopPlayer,
  Testimonial,
} from "@/src/data/mock/landing.mock";

export interface LandingViewModel {
  stats: LandingStats;
  features: Feature[];
  featuredTournaments: FeaturedTournament[];
  topPlayers: TopPlayer[];
  testimonials: Testimonial[];
}

/**
 * Presenter for Landing Page
 * Follows Clean Architecture with proper separation of concerns
 */
export class LandingPresenter {
  /**
   * Get view model for the landing page
   */
  async getViewModel(): Promise<LandingViewModel> {
    try {
      // Get data from master and mock data
      // In future, this will be fetched from API/Database
      const stats = landingMockData.stats;
      const features = FEATURES;
      const featuredTournaments = landingMockData.featuredTournaments;
      const topPlayers = landingMockData.topPlayers;
      const testimonials = landingMockData.testimonials;

      return {
        stats,
        features,
        featuredTournaments,
        topPlayers,
        testimonials,
      };
    } catch (error) {
      console.error("Error loading landing page data:", error);
      throw error;
    }
  }

  /**
   * Generate metadata for the page
   */
  async generateMetadata() {
    try {
      return {
        title: "Dummy Legends - แข่งขันเกมไพ่ดัมมี่ออนไลน์",
        description:
          "Dummy Legends แพลตฟอร์มแข่งขันเกมไพ่ดัมมี่ออนไลน์ระดับโปร รองรับทัวร์นาเมนต์ จัดอันดับ พร้อมระบบคอมมูนิตี้ครบวงจร เล่นได้ทุกที่ ทุกเวลา",
      };
    } catch (error) {
      console.error("Error generating metadata:", error);
      throw error;
    }
  }
}

/**
 * Factory for creating LandingPresenter instances
 */
export class LandingPresenterFactory {
  static async createServer(): Promise<LandingPresenter> {
    return new LandingPresenter();
  }

  static createClient(): LandingPresenter {
    return new LandingPresenter();
  }
}
