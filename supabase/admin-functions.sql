-- Admin RPC functions required by apps/web/components/features/admin/hooks/useSubmissions.ts

-- Updates a submission's moderation status + feedback.
-- p_status must be one of submission_status enum: on_review | featured | posted | rejected
CREATE OR REPLACE FUNCTION public.update_submission_as_admin(
  p_component_id INT,
  p_status TEXT,
  p_feedback TEXT
)
RETURNS json AS $$
DECLARE
  v_user_id TEXT;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := public.requesting_user_id();

  SELECT is_admin INTO v_is_admin
  FROM public.users
  WHERE id = v_user_id;

  IF NOT COALESCE(v_is_admin, FALSE) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User does not have admin privileges'
    );
  END IF;

  UPDATE public.submissions
  SET
    status = p_status::public.submission_status,
    moderators_feedback = p_feedback
  WHERE component_id = p_component_id;

  IF FOUND THEN
    RETURN json_build_object('success', true);
  END IF;

  RETURN json_build_object(
    'success', false,
    'error', 'No submission found with the provided component ID'
  );
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid status value: ' || p_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updates a demo's name and slug (admin only).
CREATE OR REPLACE FUNCTION public.update_demo_info_as_admin(
  p_component_id INT,
  p_demo_name TEXT,
  p_demo_slug TEXT
)
RETURNS json AS $$
DECLARE
  v_result json;
  v_user_id TEXT;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := public.requesting_user_id();

  SELECT is_admin INTO v_is_admin
  FROM public.users
  WHERE id = v_user_id;

  IF NOT COALESCE(v_is_admin, FALSE) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User does not have admin privileges'
    );
  END IF;

  UPDATE public.demos
  SET
    name = p_demo_name,
    demo_slug = p_demo_slug,
    updated_at = NOW()
  WHERE component_id = p_component_id;

  IF FOUND THEN
    v_result := json_build_object('success', true);
  ELSE
    v_result := json_build_object(
      'success', false,
      'error', 'No demo found with the provided component ID'
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
