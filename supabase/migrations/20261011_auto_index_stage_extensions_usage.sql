-- Candidate integrity checks call extensions.digest while the dedicated stage
-- role writes candidate records. Grant schema lookup only; do not grant CREATE.
GRANT USAGE ON SCHEMA extensions TO auto_index_stage;

DO $$
BEGIN
  IF NOT has_schema_privilege('auto_index_stage','extensions','USAGE') OR
     has_schema_privilege('auto_index_stage','extensions','CREATE') THEN
    RAISE EXCEPTION 'auto_index_stage extensions privilege is not least-privilege';
  END IF;
END $$;
