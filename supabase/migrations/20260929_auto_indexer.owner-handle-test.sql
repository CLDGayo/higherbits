-- Transactional smoke test for GitHub-backed auto-index author handles.
-- Run after 20260929_auto_indexer.sql in a test DB; rows roll back (identity counters advance).
BEGIN;
DO $test$
DECLARE first_source bigint; second_source bigint; pinned_source bigint;
        first_vendor text; second_vendor text;
BEGIN
  pinned_source:=public.register_auto_index_source('official_registry',
    'https://github.com/8starlabs/ui','8StarLabs UI');
  IF NOT EXISTS (SELECT 1 FROM public.auto_index_sources s JOIN public.users u ON u.id=s.vendor_user_id
    WHERE s.id=pinned_source AND s.vendor_user_id='user_autoindex_1cdb932f457ab20f9784'
      AND u.username='vendor-1cdb932f457ab20f9784' AND u.display_username='8starlabs'
      AND u.name='8StarLabs UI') THEN RAISE EXCEPTION 'pinned 8StarLabs identity changed'; END IF;
  first_source:=public.register_auto_index_source('official_registry',
    'https://github.com/higherbits-autohandle-test/one','Auto-indexed: Handle Test');
  second_source:=public.register_auto_index_source('custom_manifest',
    'https://github.com/higherbits-autohandle-test/two','Handle Test Library');
  SELECT vendor_user_id INTO STRICT first_vendor FROM public.auto_index_sources WHERE id=first_source;
  SELECT vendor_user_id INTO STRICT second_vendor FROM public.auto_index_sources WHERE id=second_source;
  IF first_vendor<>second_vendor OR NOT EXISTS (
    SELECT 1 FROM public.users WHERE id=first_vendor
      AND display_username='higherbits-autohandle-test' AND name='Handle Test'
      AND image_url='https://github.com/higherbits-autohandle-test.png'
      AND display_image_url='https://github.com/higherbits-autohandle-test.png'
      AND bio='Auto-indexed open-source components. This publisher has not claimed this profile.'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.auto_index_sources WHERE id=first_source AND owner_label='Handle Test'
  ) THEN RAISE EXCEPTION 'same GitHub owner did not receive one clean, disclosed profile'; END IF;

  INSERT INTO public.users(id,email,username,display_username,name)
  VALUES('user_autohandle_collision_test','autohandle-collision@higherbits.invalid',
    'autohandle-collision-internal','higherbits-autohandle-collision','Collision Test');
  BEGIN
    PERFORM public.register_auto_index_source('official_registry',
      'https://github.com/higherbits-autohandle-collision/one','Collision Test');
    RAISE EXCEPTION 'public handle collision was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'GitHub owner handle is already taken' THEN RAISE; END IF;
  END;
END $test$;
ROLLBACK;
