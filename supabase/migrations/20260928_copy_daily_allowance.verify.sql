DO $$
BEGIN
  IF to_regclass('public.copy_daily_usage') IS NULL OR to_regclass('public.copy_release_grants') IS NULL THEN RAISE EXCEPTION 'copy tables missing'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='copy_daily_usage_day') THEN RAISE EXCEPTION 'cleanup index missing'; END IF;
  IF position('clock_timestamp' IN pg_get_functiondef('public.copy_admission_clock()'::regprocedure))=0 THEN RAISE EXCEPTION 'production clock replaced'; END IF;
END $$;
