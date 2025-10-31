"use client";

import { useCallback, useEffect, useState } from "react";
import { RulesPresenterFactory } from "./RulesPresenter";
import type { RulesViewModel } from "./RulesPresenter";

const presenter = RulesPresenterFactory.createClient();

export interface RulesPresenterState {
  viewModel: RulesViewModel | null;
  loading: boolean;
  error: string | null;
}

export interface RulesPresenterActions {
  loadData: () => Promise<void>;
  setError: (error: string | null) => void;
}

export function useRulesPresenter(
  initialViewModel?: RulesViewModel
): [RulesPresenterState, RulesPresenterActions] {
  const [viewModel, setViewModel] = useState<RulesViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await presenter.getViewModel();
      setViewModel(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error loading dummy rules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [initialViewModel, loadData]);

  return [
    {
      viewModel,
      loading,
      error,
    },
    {
      loadData,
      setError,
    },
  ];
}
