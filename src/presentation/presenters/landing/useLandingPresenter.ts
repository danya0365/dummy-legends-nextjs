"use client";

import { useCallback, useEffect, useState } from "react";
import { LandingViewModel, LandingPresenterFactory } from "./LandingPresenter";

// Initialize presenter instance once (singleton pattern)
const presenter = LandingPresenterFactory.createClient();

export interface LandingPresenterState {
  viewModel: LandingViewModel | null;
  loading: boolean;
  error: string | null;
}

export interface LandingPresenterActions {
  loadData: () => Promise<void>;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for Landing presenter
 * Provides state management and actions for Landing page
 */
export function useLandingPresenter(
  initialViewModel?: LandingViewModel
): [LandingPresenterState, LandingPresenterActions] {
  const [viewModel, setViewModel] = useState<LandingViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newViewModel = await presenter.getViewModel();
      setViewModel(newViewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error loading landing page data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount if no initial view model
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
