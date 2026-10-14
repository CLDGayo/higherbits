INSERT INTO public.public_profiles (id) VALUES (1), (2);
INSERT INTO public.components (id, user_id, is_public, registry) VALUES
  (1, 1, true, NULL), (2, 1, false, NULL),
  (3, 1, true, 'auto-index'), (4, 1, true, 'auto-index');
INSERT INTO public.approved_components (component_id) VALUES (3);
INSERT INTO public.demos (id, component_id, user_id) VALUES
  (11, 1, 1), (12, 2, 1), (13, 3, 2), (14, 4, 1), (15, 1, 2);
INSERT INTO public.tags (id, slug) VALUES (1, 'hero'), (2, 'gradients');
INSERT INTO public.demo_tags (demo_id, tag_id) VALUES
  (11, 1), (11, 1), (12, 1), (13, 1), (14, 1), (15, 2);
