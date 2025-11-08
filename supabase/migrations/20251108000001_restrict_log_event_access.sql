BEGIN;

REVOKE EXECUTE ON FUNCTION public.log_game_event(
  UUID,
  UUID,
  public.game_event_type,
  TEXT,
  JSONB,
  UUID,
  TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.log_game_event(
  UUID,
  UUID,
  public.game_event_type,
  TEXT,
  JSONB,
  UUID,
  TEXT
) TO service_role;

COMMIT;
