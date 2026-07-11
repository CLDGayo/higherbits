-- Dependency-closure maintenance for component_dependencies_closure.
-- Recovered from the original 21st.dev schema dump
-- (db/migrations/20241025104254_remote_schema.sql), adapted for this DB:
-- demo dependencies are unioned from BOTH components.demo_direct_registry_dependencies
-- (legacy column) AND demos.demo_direct_registry_dependencies (current publish flow
-- writes per-demo rows), and jsonb_typeof guards prevent non-array values from
-- aborting publish inserts.
--
-- component_dependencies_graph_view_v3 (supabase/views.sql) reads this table;
-- without these triggers it stays empty and registry installs resolve no deps.
--
-- RLS intentionally not enabled: every table in this DB currently runs without
-- RLS (server-side service-role access only). The original gated writes with a
-- trigger_policy USING is_trigger_operation(); revisit in a global RLS pass.

-- Returns true only when called from within a trigger execution.
-- Kept for parity with generated types; used by the original RLS trigger_policy.
CREATE OR REPLACE FUNCTION public.is_trigger_operation() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$BEGIN
  RETURN (SELECT TRUE FROM pg_trigger WHERE tgrelid = TG_RELID AND tgname = TG_NAME);
END;$$;

-- Rebuilds the full closure for one component.
-- p_demo_slug is accepted for signature parity with the upstream API but the
-- whole component is always recomputed (closure rows are not scoped per demo).
CREATE OR REPLACE FUNCTION public.update_component_dependencies_closure(
  p_component_id bigint,
  p_demo_slug text DEFAULT NULL
) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  direct_deps TEXT[];
  demo_direct_deps TEXT[];
  dep TEXT;
  dep_username TEXT;
  dep_slug TEXT;
  dep_component_id BIGINT;
BEGIN
  -- Delete existing dependencies for this component
  DELETE FROM component_dependencies_closure
  WHERE component_id = p_component_id;

  -- Initialize the closure table with the component itself (depth 0)
  INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
  VALUES (p_component_id, p_component_id, 0, FALSE);

  -- Direct dependencies from the component
  SELECT COALESCE(ARRAY(
    SELECT jsonb_array_elements_text(direct_registry_dependencies)
    FROM components
    WHERE id = p_component_id
      AND jsonb_typeof(direct_registry_dependencies) = 'array'
  ), '{}') INTO direct_deps;

  -- Demo dependencies: legacy column on components UNION per-demo rows in demos
  SELECT COALESCE(array_agg(DISTINCT d.dep), '{}') INTO demo_direct_deps
  FROM (
    SELECT jsonb_array_elements_text(demo_direct_registry_dependencies) AS dep
    FROM components
    WHERE id = p_component_id
      AND jsonb_typeof(demo_direct_registry_dependencies) = 'array'
    UNION
    SELECT jsonb_array_elements_text(demo_direct_registry_dependencies)
    FROM demos
    WHERE component_id = p_component_id
      AND jsonb_typeof(demo_direct_registry_dependencies) = 'array'
  ) d;

  -- Process direct dependencies (is_demo_dependency = FALSE)
  FOREACH dep IN ARRAY direct_deps
  LOOP
    dep_username := split_part(dep, '/', 1);
    dep_slug := split_part(dep, '/', 2);

    SELECT c.id INTO dep_component_id
    FROM components c
    JOIN users u ON c.user_id = u.id
    WHERE u.username = dep_username
      AND c.component_slug = dep_slug
    LIMIT 1;

    IF dep_component_id IS NOT NULL THEN
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      VALUES (p_component_id, dep_component_id, 1, FALSE)
      ON CONFLICT DO NOTHING;

      -- Indirect dependencies from the dependency's own closure
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      SELECT p_component_id, cd.dependency_component_id, cd.depth + 1, FALSE
      FROM component_dependencies_closure cd
      WHERE cd.component_id = dep_component_id
        AND cd.dependency_component_id <> p_component_id
      ON CONFLICT DO NOTHING;
    ELSE
      RAISE NOTICE 'Dependency not found for %/%', dep_username, dep_slug;
    END IF;
  END LOOP;

  -- Process demo dependencies (is_demo_dependency = TRUE)
  FOREACH dep IN ARRAY demo_direct_deps
  LOOP
    dep_username := split_part(dep, '/', 1);
    dep_slug := split_part(dep, '/', 2);

    SELECT c.id INTO dep_component_id
    FROM components c
    JOIN users u ON c.user_id = u.id
    WHERE u.username = dep_username
      AND c.component_slug = dep_slug
    LIMIT 1;

    IF dep_component_id IS NOT NULL THEN
      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      VALUES (p_component_id, dep_component_id, 1, TRUE)
      ON CONFLICT DO NOTHING;

      INSERT INTO component_dependencies_closure (component_id, dependency_component_id, depth, is_demo_dependency)
      SELECT p_component_id, cd.dependency_component_id, cd.depth + 1, TRUE
      FROM component_dependencies_closure cd
      WHERE cd.component_id = dep_component_id
        AND cd.is_demo_dependency = TRUE
        AND cd.dependency_component_id <> p_component_id
      ON CONFLICT DO NOTHING;
    ELSE
      RAISE NOTICE 'Demo dependency not found for %/%', dep_username, dep_slug;
    END IF;
  END LOOP;
END;$$;

-- Trigger wrappers ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.components_dependencies_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$BEGIN
  PERFORM update_component_dependencies_closure(NEW.id);
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.demos_dependencies_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$BEGIN
  IF NEW.component_id IS NOT NULL THEN
    PERFORM update_component_dependencies_closure(NEW.component_id);
  END IF;
  RETURN NEW;
END;$$;

-- ponytail: unconditional recompute on every row update (matches upstream);
-- add a WHEN (deps IS DISTINCT FROM ...) guard if write volume ever matters.
CREATE OR REPLACE TRIGGER components_dependencies_trigger
  AFTER INSERT OR UPDATE ON public.components
  FOR EACH ROW EXECUTE FUNCTION public.components_dependencies_trigger();

CREATE OR REPLACE TRIGGER demos_dependencies_trigger
  AFTER INSERT OR UPDATE ON public.demos
  FOR EACH ROW EXECUTE FUNCTION public.demos_dependencies_trigger();
