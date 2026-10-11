DO $$
BEGIN
  IF NOT has_schema_privilege('auto_index_stage','extensions','USAGE') OR
     has_schema_privilege('auto_index_stage','extensions','CREATE') THEN
    RAISE EXCEPTION 'auto_index_stage must have extensions USAGE without CREATE';
  END IF;
  IF has_schema_privilege('auto_index_reviewer','extensions','USAGE') THEN
    RAISE EXCEPTION 'extensions access must not be granted to auto_index_reviewer';
  END IF;
END $$;
