-- Run after 20260929_auto_indexer.sql in a test DB; all rows roll back.
BEGIN;
DO $test$
BEGIN
  INSERT INTO public.users(id,email,username,display_username,name)
  VALUES('user_handle_alice_test','handle-alice@higherbits.invalid','handle-alice-test','handle-alice-test','Alice');
  INSERT INTO public.users(id,email,username,display_username,name)
  VALUES('user_handle_bob_test','handle-bob@higherbits.invalid','handle-bob-test','handle-bob-public','Bob');

  BEGIN
    INSERT INTO public.users(id,email,username,display_username,name)
    VALUES('user_handle_collision_test','handle-collision@higherbits.invalid',
      'other-handle-test','HANDLE-ALICE-TEST','Collision');
    RAISE EXCEPTION 'cross-column duplicate insert was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.users SET display_username='HANDLE-BOB-TEST' WHERE id='user_handle_alice_test';
    RAISE EXCEPTION 'cross-column duplicate update was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  UPDATE public.users SET username='HANDLE-ALICE-TEST' WHERE id='user_handle_alice_test';
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id='user_handle_alice_test'
    AND username='HANDLE-ALICE-TEST' AND display_username='handle-alice-test') THEN
    RAISE EXCEPTION 'same-user case-only edit failed'; END IF;
END $test$;
ROLLBACK;
