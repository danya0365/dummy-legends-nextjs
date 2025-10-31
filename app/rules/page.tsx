import { RulesView } from "@/src/presentation/components/rules/RulesView";
import { RulesPresenterFactory } from "@/src/presentation/presenters/rules/RulesPresenter";
import { MainLayout } from "@/src/presentation/components/layout";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const presenter = await RulesPresenterFactory.createServer();

  try {
    return presenter.generateMetadata();
  } catch (error) {
    console.error("Error generating dummy rules metadata:", error);
    return {
      title: "กติกาไพ่ดัมมี่ | Dummy Legends",
      description:
        "เรียนรู้และเข้าใจกฎ กติกาไพ่ดัมมี่ ทั้งวิธีการเล่น การนับแต้ม และเคล็ดลับสำคัญสำหรับผู้เล่นทุกระดับ",
    };
  }
}

export default async function RulesPage() {
  const presenter = await RulesPresenterFactory.createServer();

  try {
    const viewModel = await presenter.getViewModel();

    return (
      <MainLayout>
        <RulesView initialViewModel={viewModel} />
      </MainLayout>
    );
  } catch (error) {
    console.error("Error loading dummy rules page:", error);

    return (
      <MainLayout>
        <div className="min-h-[60vh] bg-slate-950 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="text-2xl font-bold text-white">เกิดข้อผิดพลาด</h1>
            <p className="mt-2 text-gray-300">
              ไม่สามารถโหลดข้อมูลกติกาไพ่ดัมมี่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/"
                className="rounded-lg bg-primary px-5 py-2 text-white transition hover:bg-primary/80"
              >
                กลับหน้าแรก
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
}
