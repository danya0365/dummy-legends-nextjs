"use client";

import { useRulesPresenter } from "@/src/presentation/presenters/rules/useRulesPresenter";
import type { RulesViewModel } from "@/src/presentation/presenters/rules/RulesPresenter";
import { cn } from "@/src/utils/cn";

interface RulesViewProps {
  initialViewModel?: RulesViewModel;
}

export function RulesView({ initialViewModel }: RulesViewProps) {
  const [state] = useRulesPresenter(initialViewModel);
  const viewModel = state.viewModel;

  if (state.loading && !viewModel) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-gray-700 border-t-primary" />
          <p className="text-gray-300">กำลังโหลดกติกาไพ่ดัมมี่...</p>
        </div>
      </div>
    );
  }

  if (state.error && !viewModel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <p className="mb-2 text-xl font-semibold text-white">เกิดข้อผิดพลาด</p>
          <p className="text-gray-400">{state.error}</p>
        </div>
      </div>
    );
  }

  if (!viewModel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center text-gray-400">
          <div className="mb-4 text-5xl">🃏</div>
          <p className="text-lg">ยังไม่มีกติกาที่จะแสดงในขณะนี้</p>
        </div>
      </div>
    );
  }

  const {
    hero,
    basics,
    gameplay,
    highlights,
    scoring,
    cardPoints,
    strategicTips,
    closingRemark,
  } =
    viewModel;

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              Dummy Legends Academy
            </span>
            <h1 className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-4 text-lg text-gray-300 sm:text-xl">{hero.subtitle}</p>
            <p className="mt-6 text-base leading-relaxed text-gray-300 sm:text-lg">
              {hero.intro}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {basics.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-primary/60 hover:bg-white/10",
                item.highlight && "border-primary/70 bg-primary/10"
              )}
            >
              <p className="text-sm uppercase tracking-wide text-gray-400">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white">ภาพรวมการเล่น</h2>
              <p className="mt-3 text-gray-300">{gameplay.overview}</p>
              <div className="mt-6 space-y-3">
                {gameplay.steps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
                <h3 className="text-xl font-semibold text-primary">วิธีชนะ</h3>
                <ul className="mt-4 space-y-3 text-gray-200">
                  {gameplay.victoryConditions.map((rule) => (
                    <li key={rule} className="flex items-start gap-3">
                      <span className="mt-1 text-xl">🏆</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💡</span>
          <div>
            <h2 className="text-2xl font-semibold text-white">จุดสำคัญที่ต้องจับตา</h2>
            <p className="text-gray-300">
              เข้าใจคำศัพท์และสถานการณ์สำคัญ เพื่อใช้ประโยชน์สูงสุดจากไพ่ที่มีอยู่ในมือ
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-md transition hover:border-primary/50 hover:bg-slate-900/80"
            >
              <h3 className="text-xl font-semibold text-white">{highlight.title}</h3>
              <p className="mt-2 text-gray-300">{highlight.description}</p>
              {highlight.examples && (
                <ul className="mt-4 space-y-2 text-sm text-primary/90">
                  {highlight.examples.map((example) => (
                    <li key={example} className="flex items-start gap-2">
                      <span className="mt-0.5 text-xs">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              )}
              {highlight.extraNotes && (
                <p className="mt-4 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary/90">
                  {highlight.extraNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">ตารางคะแนนไพ่แต่ละใบ</h2>
            <p className="mt-2 text-gray-300">
              อ้างอิงจากกติกาดัมมี่: ไพ่แต่ละกลุ่มจะให้คะแนนต่างกัน เลือกใช้ให้คุ้มค่าและระวังแต้มสูง
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm text-primary">
            คะแนนยิ่งสูง ยิ่งต้องระวังไม่ให้คนอื่นเก็บ
          </span>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          {cardPoints.map((group) => (
            <div
              key={group.id}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-lg transition hover:-translate-y-1 hover:border-primary/40 hover:bg-slate-900/90",
                group.highlight && "border-amber-400/60 bg-amber-500/10"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">{group.title}</h3>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    group.highlight
                      ? "bg-amber-400/20 text-amber-200"
                      : "bg-primary/15 text-primary"
                  )}
                >
                  {group.points}
                </span>
              </div>
              {group.description && (
                <p className="mt-3 text-sm text-gray-300">{group.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {group.cards.map((card) => (
                  <span
                    key={card}
                    className={cn(
                      "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-semibold text-white",
                      card === "2♣" || card === "Q♠"
                        ? "border-amber-300/60 bg-amber-100/10 text-amber-100"
                        : ""
                    )}
                  >
                    {card}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">➕</span>
              <h2 className="text-xl font-semibold text-emerald-200">การนับแต้ม (บวก)</h2>
            </div>
            <ul className="mt-4 space-y-4">
              {scoring.positive.map((item) => (
                <li key={item.id} className="rounded-xl border border-emerald-400/40 bg-black/20 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-emerald-200">{item.points}</p>
                    <p className="text-gray-200">{item.description}</p>
                    {item.note && <p className="text-xs text-emerald-100/80">{item.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">➖</span>
              <h2 className="text-xl font-semibold text-rose-200">การนับแต้ม (ลบ)</h2>
            </div>
            <ul className="mt-4 space-y-4">
              {scoring.negative.map((item) => (
                <li key={item.id} className="rounded-xl border border-rose-400/40 bg-black/20 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-rose-200">{item.points}</p>
                    <p className="text-gray-200">{item.description}</p>
                    {item.note && <p className="text-xs text-rose-100/80">{item.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">เคล็ดลับการเล่น</h2>
              <p className="mt-2 text-gray-300">
                ยกระดับการเล่นของคุณด้วยเทคนิคพื้นฐานที่ผู้เล่น Dummy Legends ทุกคนควรรู้
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {strategicTips.map((tip) => (
              <div key={tip.id} className="rounded-2xl border border-white/10 bg-black/20 p-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{tip.title}</h3>
                    <p className="mt-2 text-sm text-gray-300">{tip.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-primary/20 bg-primary/10 p-10 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">พร้อมลงสนามจริงหรือยัง?</h2>
          <p className="mt-4 text-lg text-white/90">{closingRemark}</p>
        </div>
      </section>
    </div>
  );
}
