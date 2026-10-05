BEGIN;

ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS ghl_source_fingerprint text
  CHECK (ghl_source_fingerprint IS NULL OR ghl_source_fingerprint ~ '^[a-f0-9]{64}$');

CREATE TABLE public.auto_index_sources (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('official_registry','custom_manifest')),
  canonical_url text NOT NULL UNIQUE CHECK (canonical_url ~ '^https://[^[:space:]]+$'),
  owner_label text NOT NULL CHECK (length(owner_label) BETWEEN 1 AND 200),
  vendor_user_id text NOT NULL REFERENCES public.users(id),
  opted_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Refresh generations are issued before component bytes are fetched. The append-only
-- run ledger preserves that ordering even when older network work completes later.
CREATE TABLE public.auto_index_refresh_state (
  source_id bigint NOT NULL REFERENCES public.auto_index_sources(id),
  item_key text NOT NULL CHECK (length(item_key) BETWEEN 1 AND 512),
  current_generation bigint NOT NULL DEFAULT 0 CHECK (current_generation >= 0),
  latest_revision text CHECK (latest_revision IS NULL OR latest_revision ~ '^[a-f0-9]{40,64}$'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id,item_key),
  CHECK ((current_generation=0)=(latest_revision IS NULL))
);
CREATE TABLE public.auto_index_refresh_runs (
  source_id bigint NOT NULL,
  item_key text NOT NULL,
  generation bigint NOT NULL CHECK (generation>0),
  revision text NOT NULL CHECK (revision ~ '^[a-f0-9]{40,64}$'),
  started_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id,item_key,generation),
  UNIQUE (source_id,item_key,generation,revision),
  UNIQUE (source_id,item_key,revision),
  FOREIGN KEY (source_id,item_key) REFERENCES public.auto_index_refresh_state(source_id,item_key)
);

CREATE TABLE public.auto_index_candidates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id bigint NOT NULL REFERENCES public.auto_index_sources(id),
  item_key text NOT NULL CHECK (length(item_key) BETWEEN 1 AND 512),
  revision text NOT NULL CHECK (revision ~ '^[a-f0-9]{40,64}$'),
  refresh_generation bigint,
  component_source_path text CHECK (component_source_path IS NULL OR (length(component_source_path) BETWEEN 1 AND 256 AND component_source_path !~ '(^/|(^|/)\.\.(/|$))')),
  repository_url text CHECK (repository_url IS NULL OR repository_url ~ '^https://[^[:space:]]+$'),
  manifest_sha256 bytea CHECK (manifest_sha256 IS NULL OR octet_length(manifest_sha256)=32),
  dependencies jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(dependencies)='array'),
  dependencies_approved boolean NOT NULL DEFAULT false,
  license_spdx text CHECK (license_spdx IS NULL OR license_spdx IN ('MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0','ISC')),
  license_text text,
  license_sha256 bytea CHECK (license_sha256 IS NULL OR octet_length(license_sha256)=32),
  notice_text text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  etag text,
  last_modified text,
  UNIQUE (source_id,item_key,revision),
  FOREIGN KEY (source_id,item_key,refresh_generation,revision)
    REFERENCES public.auto_index_refresh_runs(source_id,item_key,generation,revision),
  CHECK ((license_text IS NULL) = (license_sha256 IS NULL)),
  CHECK (license_sha256 IS NULL OR license_sha256=extensions.digest(convert_to(license_text,'UTF8'),'sha256'))
);

-- A candidate can contain every upstream file. Keep the original bytes, not a flattened TSX proxy.
CREATE TABLE public.auto_index_candidate_files (
  candidate_id bigint NOT NULL REFERENCES public.auto_index_candidates(id),
  path text NOT NULL CHECK (length(path) BETWEEN 1 AND 256 AND path !~ '(^/|(^|/)\.\.(/|$))'),
  registry_type text NOT NULL DEFAULT 'registry:file' CHECK (registry_type IN ('registry:ui','registry:component','registry:hook','registry:block','registry:lib','registry:style','registry:file')),
  target text CHECK (target IS NULL OR (length(target) BETWEEN 1 AND 256 AND target !~ '(^/|(^|/)\.\.(/|$))')),
  bytes bytea NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 2097152),
  sha256 bytea NOT NULL CHECK (octet_length(sha256)=32 AND sha256=extensions.digest(bytes,'sha256')),
  PRIMARY KEY (candidate_id,path)
);

CREATE TABLE public.auto_index_candidate_demos (
  candidate_id bigint PRIMARY KEY REFERENCES public.auto_index_candidates(id),
  demo_code text NOT NULL CHECK (length(demo_code)>0 AND octet_length(demo_code)<=2097152),
  demo_sha256 bytea NOT NULL CHECK (octet_length(demo_sha256)=32 AND demo_sha256=extensions.digest(convert_to(demo_code,'UTF8'),'sha256')),
  provenance_class text NOT NULL CHECK (provenance_class IN ('upstream-original','license-permitted-adaptation','higherbits-authored')),
  author_label text NOT NULL CHECK (length(author_label) BETWEEN 1 AND 200),
  source_url text CHECK (source_url IS NULL OR source_url ~ '^https://[^[:space:]]+$'),
  source_revision text CHECK (source_revision IS NULL OR source_revision ~ '^[a-f0-9]{40,64}$'),
  source_sha256 bytea CHECK (source_sha256 IS NULL OR octet_length(source_sha256)=32),
  derivation text NOT NULL CHECK (length(derivation) BETWEEN 1 AND 4000),
  control_settings jsonb NOT NULL CHECK (jsonb_typeof(control_settings)='object' AND octet_length(control_settings::text)<=16384),
  ghl_html_content text NOT NULL CHECK (length(ghl_html_content)>0 AND octet_length(ghl_html_content)<=1048576),
  ghl_source_fingerprint text NOT NULL CHECK (ghl_source_fingerprint ~ '^[a-f0-9]{64}$'),
  copy_prompts jsonb NOT NULL CHECK (jsonb_typeof(copy_prompts)='object' AND octet_length(copy_prompts::text)<=8388608),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((provenance_class='higherbits-authored' AND source_url IS NULL AND source_revision IS NULL AND source_sha256 IS NULL)
      OR (provenance_class<>'higherbits-authored' AND source_url IS NOT NULL AND source_revision IS NOT NULL AND source_sha256 IS NOT NULL))
);

-- Private pre-rendered copy text. Public demo queries use SELECT *, so never store it on demos.
CREATE TABLE public.auto_index_copy_prompts (
  demo_id integer NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  prompt_type text NOT NULL CHECK (prompt_type IN
    ('sitebrew','v0','lovable','bolt','extended','replit','magic_patterns','claude','codex','antigravity')),
  prompt text NOT NULL CHECK (length(prompt)>0 AND octet_length(prompt)<=2097152),
  source_fingerprint text NOT NULL CHECK (source_fingerprint ~ '^[a-f0-9]{64}$'),
  PRIMARY KEY (demo_id,prompt_type)
);

CREATE TABLE public.auto_index_candidate_assets (
  candidate_id bigint NOT NULL REFERENCES public.auto_index_candidates(id),
  asset_key text NOT NULL CHECK (length(asset_key) BETWEEN 1 AND 256),
  asset_role text NOT NULL CHECK (asset_role IN ('component_source','demo_source','stylesheet','font','image','license','notice')),
  provenance_class text NOT NULL CHECK (provenance_class IN ('upstream-original','license-permitted-adaptation','higherbits-authored')),
  source_url text CHECK (source_url IS NULL OR source_url ~ '^https://[^[:space:]]+$'),
  source_revision text CHECK (source_revision IS NULL OR source_revision ~ '^[a-f0-9]{40,64}$'),
  asset_sha256 bytea NOT NULL CHECK (octet_length(asset_sha256)=32),
  license_spdx text NOT NULL CHECK (license_spdx IN ('MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0','ISC')),
  license_text text NOT NULL CHECK (length(license_text)>0 AND octet_length(license_text)<=262144),
  license_sha256 bytea NOT NULL CHECK (octet_length(license_sha256)=32 AND license_sha256=extensions.digest(convert_to(license_text,'UTF8'),'sha256')),
  notice_text text NOT NULL,
  notice_sha256 bytea NOT NULL CHECK (octet_length(notice_sha256)=32),
  derivation text NOT NULL CHECK (length(derivation) BETWEEN 1 AND 4000),
  source_asset_key text CHECK (source_asset_key IS NULL OR (length(source_asset_key) BETWEEN 1 AND 256 AND source_asset_key !~ '(^/|(^|/)\.\.(/|$))')),
  source_asset_sha256 bytea CHECK (source_asset_sha256 IS NULL OR octet_length(source_asset_sha256)=32),
  transform_record jsonb,
  PRIMARY KEY (candidate_id,asset_key),
  CHECK (notice_sha256=extensions.digest(convert_to(notice_text,'UTF8'),'sha256')),
  CHECK ((provenance_class='higherbits-authored' AND source_url IS NULL AND source_revision IS NULL)
      OR (provenance_class<>'higherbits-authored' AND source_url IS NOT NULL AND source_revision IS NOT NULL)),
  CHECK ((provenance_class='license-permitted-adaptation' AND source_asset_key IS NOT NULL AND source_asset_sha256 IS NOT NULL AND
          transform_record IS NOT NULL AND jsonb_typeof(transform_record)='object' AND
          transform_record ?& ARRAY['sourceAssetKey','sourceSha256','outputSha256','operation'] AND
          transform_record-ARRAY['sourceAssetKey','sourceSha256','outputSha256','operation']='{}'::jsonb AND
          transform_record->>'sourceAssetKey'=source_asset_key AND
          transform_record->>'sourceSha256'=encode(source_asset_sha256,'hex') AND
          transform_record->>'outputSha256'=encode(asset_sha256,'hex') AND
          jsonb_typeof(transform_record->'operation')='string' AND length(transform_record->>'operation') BETWEEN 1 AND 1000 AND
          transform_record->>'operation'=derivation)
      OR (provenance_class<>'license-permitted-adaptation' AND source_asset_key IS NULL AND source_asset_sha256 IS NULL AND transform_record IS NULL))
);

CREATE TABLE public.auto_index_decisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  candidate_id bigint NOT NULL REFERENCES public.auto_index_candidates(id),
  outcome text NOT NULL CHECK (outcome IN ('approved','qualified','disqualified','excluded')),
  reason_code text NOT NULL CHECK (reason_code ~ '^[a-z][a-z0-9_]{1,63}$'),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(evidence)='object' AND octet_length(evidence::text)<=16384),
  detector text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id,outcome,reason_code)
);

CREATE FUNCTION public.auto_index_ghl_fingerprint(component_source text,demo_source text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE SET search_path=pg_catalog,public AS $$
  SELECT encode(extensions.digest(
    convert_to('higherbits-ghl-template-v3','UTF8') || decode('00','hex') ||
    int4send(octet_length(convert_to(component_source,'UTF8'))) || convert_to(component_source,'UTF8') ||
    int4send(octet_length(convert_to(demo_source,'UTF8'))) || convert_to(demo_source,'UTF8'), 'sha256'), 'hex')
$$;
CREATE FUNCTION public.auto_index_candidate_provenance_complete(p_candidate_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auto_index_candidates c
    JOIN public.auto_index_candidate_files root_file ON root_file.candidate_id=c.id AND root_file.path=coalesce(c.component_source_path,c.item_key)
    JOIN public.auto_index_candidate_demos d ON d.candidate_id=c.id
    JOIN public.auto_index_candidate_assets root_asset ON root_asset.candidate_id=c.id AND root_asset.asset_key=root_file.path
    JOIN public.auto_index_candidate_assets demo_asset ON demo_asset.candidate_id=c.id AND demo_asset.asset_key='demo_code'
    WHERE c.id=p_candidate_id AND c.dependencies_approved AND c.repository_url IS NOT NULL
      AND c.license_spdx IS NOT NULL AND c.license_text IS NOT NULL
      AND d.ghl_source_fingerprint=public.auto_index_ghl_fingerprint(convert_from(root_file.bytes,'UTF8'),d.demo_code)
      AND root_asset.asset_role='component_source' AND root_asset.asset_sha256=root_file.sha256
      AND root_asset.provenance_class='upstream-original' AND root_asset.source_url=c.repository_url
      AND root_asset.source_revision=c.revision AND root_asset.license_spdx=c.license_spdx
      AND root_asset.license_text=c.license_text AND root_asset.license_sha256=c.license_sha256
      AND root_asset.notice_text=coalesce(c.notice_text,'')
      AND root_asset.notice_sha256=extensions.digest(convert_to(coalesce(c.notice_text,''),'UTF8'),'sha256')
      AND length(root_asset.derivation) BETWEEN 1 AND 4000
      AND demo_asset.asset_role='demo_source' AND demo_asset.asset_sha256=d.demo_sha256
      AND demo_asset.provenance_class=d.provenance_class
      AND demo_asset.source_url IS NOT DISTINCT FROM d.source_url
      AND demo_asset.source_revision IS NOT DISTINCT FROM d.source_revision
      AND (d.provenance_class<>'upstream-original' OR d.source_sha256=d.demo_sha256)
      AND (d.provenance_class<>'license-permitted-adaptation' OR
           (demo_asset.source_asset_sha256=d.source_sha256 AND demo_asset.source_url=c.repository_url AND
            demo_asset.source_revision=c.revision))
      AND demo_asset.license_spdx IN ('MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0','ISC')
      AND length(demo_asset.license_text)>0 AND octet_length(demo_asset.license_text)<=262144
      AND demo_asset.license_sha256=extensions.digest(convert_to(demo_asset.license_text,'UTF8'),'sha256')
      AND octet_length(demo_asset.notice_text)<=262144
      AND demo_asset.notice_sha256=extensions.digest(convert_to(demo_asset.notice_text,'UTF8'),'sha256')
      AND length(demo_asset.derivation) BETWEEN 1 AND 4000
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_files f
        LEFT JOIN public.auto_index_candidate_assets a ON a.candidate_id=f.candidate_id AND a.asset_key=f.path
        WHERE f.candidate_id=c.id AND (
          a.candidate_id IS NULL OR a.asset_sha256 IS DISTINCT FROM f.sha256
          OR a.provenance_class IS DISTINCT FROM 'upstream-original'
          OR a.source_url IS DISTINCT FROM c.repository_url OR a.source_revision IS DISTINCT FROM c.revision
          OR a.license_spdx IS NULL OR a.license_spdx NOT IN ('MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0','ISC')
          OR a.license_text IS NULL OR length(a.license_text)=0 OR octet_length(a.license_text)>262144
          OR a.license_sha256 IS DISTINCT FROM extensions.digest(convert_to(a.license_text,'UTF8'),'sha256')
          OR a.notice_text IS NULL OR octet_length(a.notice_text)>262144
          OR a.notice_sha256 IS DISTINCT FROM extensions.digest(convert_to(a.notice_text,'UTF8'),'sha256')
          OR a.derivation IS NULL OR length(a.derivation) NOT BETWEEN 1 AND 4000))
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_assets a
        LEFT JOIN public.auto_index_candidate_files source_file ON source_file.candidate_id=a.candidate_id AND source_file.path=a.source_asset_key
        LEFT JOIN public.auto_index_candidate_assets source_asset ON source_asset.candidate_id=a.candidate_id AND source_asset.asset_key=a.source_asset_key
        WHERE a.candidate_id=c.id AND a.provenance_class='license-permitted-adaptation' AND (
          source_file.candidate_id IS NULL OR source_asset.candidate_id IS NULL OR
          source_file.sha256 IS DISTINCT FROM a.source_asset_sha256 OR source_asset.asset_sha256 IS DISTINCT FROM a.source_asset_sha256 OR
          source_asset.provenance_class IS DISTINCT FROM 'upstream-original' OR source_asset.source_url IS DISTINCT FROM c.repository_url OR
          source_asset.source_revision IS DISTINCT FROM c.revision OR a.source_url IS DISTINCT FROM c.repository_url OR
          a.source_revision IS DISTINCT FROM c.revision OR a.transform_record->>'sourceAssetKey' IS DISTINCT FROM a.source_asset_key OR
          a.transform_record->>'sourceSha256' IS DISTINCT FROM encode(source_file.sha256,'hex') OR
          a.transform_record->>'outputSha256' IS DISTINCT FROM encode(a.asset_sha256,'hex')))
      AND (SELECT count(*) FROM public.auto_index_candidate_assets a WHERE a.candidate_id=c.id)=
          (SELECT count(*)+1 FROM public.auto_index_candidate_files f WHERE f.candidate_id=c.id)
  )
$$;

CREATE TABLE public.auto_index_publications (
  source_id bigint NOT NULL REFERENCES public.auto_index_sources(id),
  item_key text NOT NULL,
  component_id integer NOT NULL REFERENCES public.components(id),
  approved_decision_id bigint NOT NULL REFERENCES public.auto_index_decisions(id),
  delisted_decision_id bigint REFERENCES public.auto_index_decisions(id),
  delisted_at timestamptz,
  superseded_at timestamptz,
  published_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id,item_key,approved_decision_id),
  CHECK ((delisted_decision_id IS NULL)=(delisted_at IS NULL)),
  CHECK (delisted_at IS NULL OR superseded_at IS NULL)
);
CREATE UNIQUE INDEX auto_index_one_active_publication
  ON public.auto_index_publications(source_id,item_key)
  WHERE delisted_at IS NULL AND superseded_at IS NULL;

-- The retained row makes fencing_generation monotonic even after a lease is
-- released; expired holders cannot persist output after a replacement claim.
CREATE TABLE public.sandbox_ghl_review_leases (
  user_id text NOT NULL REFERENCES public.users(id),
  demo_id bigint NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  input_fingerprint text,
  owner_token uuid,
  fencing_generation bigint NOT NULL DEFAULT 0 CHECK (fencing_generation>=0),
  lease_expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,demo_id),
  CHECK (input_fingerprint IS NULL OR input_fingerprint ~ '^[a-f0-9]{64}$'),
  CHECK ((owner_token IS NULL)=(input_fingerprint IS NULL)),
  CHECK ((owner_token IS NULL)=(lease_expires_at IS NULL)),
  CHECK (owner_token IS NULL OR fencing_generation>0)
);
CREATE INDEX sandbox_ghl_review_leases_demo_id_idx
  ON public.sandbox_ghl_review_leases(demo_id);

CREATE FUNCTION public.register_auto_index_source(p_kind text,p_canonical_url text,p_owner_label text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE fingerprint text; vendor_id text; vendor_handle text; vendor_suffix text; source_id bigint;
        github_handle text; clean_label text; vendor_count integer;
BEGIN
  IF p_kind IS NULL OR p_kind NOT IN ('official_registry','custom_manifest') OR
     p_canonical_url IS NULL OR p_canonical_url !~ '^https://github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$' OR
     p_owner_label IS NULL OR length(p_owner_label) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'invalid source registration'; END IF;
  github_handle:=lower(split_part(p_canonical_url,'/',4));
  clean_label:=regexp_replace(btrim(p_owner_label),'^Auto-indexed:[[:space:]]*','','i');
  IF github_handle !~ '^[a-z0-9][a-z0-9-]{0,38}$' OR right(github_handle,1)='-' OR
     clean_label IS NULL OR length(clean_label) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'invalid GitHub owner'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(20260930,pg_catalog.hashtext(github_handle));
  SELECT min(s.vendor_user_id),count(DISTINCT s.vendor_user_id) INTO vendor_id,vendor_count
    FROM public.auto_index_sources s
    WHERE s.canonical_url ~ '^https://github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$'
      AND lower(split_part(s.canonical_url,'/',4))=github_handle;
  IF vendor_count>1 THEN RAISE EXCEPTION 'GitHub owner already has conflicting vendor profiles'; END IF;
  fingerprint:=encode(extensions.digest(convert_to(p_canonical_url,'UTF8'),'sha256'),'hex');
  IF vendor_id IS NULL THEN vendor_id:='user_autoindex_'||substr(fingerprint,1,20); END IF;
  vendor_suffix:=substring(vendor_id from '^user_autoindex_([a-f0-9]{20})$');
  IF vendor_suffix IS NULL THEN RAISE EXCEPTION 'invalid auto-index vendor identity'; END IF;
  vendor_handle:='vendor-'||vendor_suffix;
  IF EXISTS (SELECT 1 FROM public.users u WHERE u.id<>vendor_id AND
     (lower(u.username)=github_handle OR lower(u.display_username)=github_handle)) THEN
    RAISE EXCEPTION 'GitHub owner handle is already taken'; END IF;
  INSERT INTO public.users(id,email,username,display_username,name,display_name,manually_added,bio,
    github_url,image_url,display_image_url)
  VALUES(vendor_id,'vendor+'||vendor_suffix||'@higherbits.invalid',vendor_handle,github_handle,
         clean_label,clean_label,true,
         'Auto-indexed open-source components. This publisher has not claimed this profile.',
         'https://github.com/'||github_handle,
         'https://github.com/'||github_handle||'.png','https://github.com/'||github_handle||'.png')
  ON CONFLICT(id) DO NOTHING;
  UPDATE public.users u SET display_username=github_handle,
    name=regexp_replace(u.name,'^Auto-indexed:[[:space:]]*','','i'),
    display_name=regexp_replace(u.display_name,'^Auto-indexed:[[:space:]]*','','i'),
    github_url='https://github.com/'||github_handle,
    image_url=coalesce(nullif(u.image_url,''),'https://github.com/'||github_handle||'.png'),
    display_image_url=coalesce(nullif(u.display_image_url,''),'https://github.com/'||github_handle||'.png')
    WHERE u.id=vendor_id AND u.username=vendor_handle AND u.manually_added
      AND u.email='vendor+'||vendor_suffix||'@higherbits.invalid'
      AND u.bio='Auto-indexed open-source components. This publisher has not claimed this profile.'
      AND (u.display_username=vendor_handle OR lower(u.display_username)=github_handle)
      AND (u.github_url IS NULL OR lower(u.github_url)='https://github.com/'||github_handle);
  IF NOT FOUND THEN RAISE EXCEPTION 'vendor identity collision'; END IF;
  INSERT INTO public.auto_index_sources(kind,canonical_url,owner_label,vendor_user_id)
  VALUES(p_kind,p_canonical_url,clean_label,vendor_id)
  ON CONFLICT(canonical_url) DO NOTHING;
  SELECT id INTO STRICT source_id FROM public.auto_index_sources WHERE canonical_url=p_canonical_url
    AND kind=p_kind AND owner_label=clean_label AND vendor_user_id=vendor_id;
  RETURN source_id;
END $$;

-- Called after an item is selected and before fetching its pinned source files. A
-- repeated revision reuses its first generation; selecting a different revision
-- advances the fence, so a slower older fetch cannot finalize afterward.
CREATE FUNCTION public.begin_auto_index_refresh(p_source_id bigint,p_item_key text,p_revision text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_generation bigint; issued_generation bigint;
BEGIN
  IF p_item_key IS NULL OR length(p_item_key) NOT BETWEEN 1 AND 512 OR
     p_revision !~ '^[a-f0-9]{40,64}$' THEN RAISE EXCEPTION 'invalid refresh selection'; END IF;
  PERFORM 1 FROM public.auto_index_sources WHERE id=p_source_id AND NOT opted_out FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'source unavailable for refresh'; END IF;
  INSERT INTO public.auto_index_refresh_state(source_id,item_key)
  VALUES(p_source_id,p_item_key) ON CONFLICT(source_id,item_key) DO NOTHING;
  SELECT state.current_generation INTO STRICT current_generation
    FROM public.auto_index_refresh_state state
    WHERE state.source_id=p_source_id AND state.item_key=p_item_key FOR UPDATE;
  SELECT run.generation INTO issued_generation FROM public.auto_index_refresh_runs run
    WHERE run.source_id=p_source_id AND run.item_key=p_item_key AND run.revision=p_revision;
  IF FOUND THEN RETURN issued_generation; END IF;
  issued_generation:=current_generation+1;
  UPDATE public.auto_index_refresh_state state
    SET current_generation=issued_generation,latest_revision=p_revision,updated_at=now()
    WHERE state.source_id=p_source_id AND state.item_key=p_item_key;
  INSERT INTO public.auto_index_refresh_runs(source_id,item_key,generation,revision)
    VALUES(p_source_id,p_item_key,issued_generation,p_revision);
  RETURN issued_generation;
END $$;

-- History is append-only even for the service role. A new decision supersedes an old one.
CREATE FUNCTION public.auto_index_history_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  RAISE EXCEPTION 'auto-index history is append-only';
END $$;
CREATE FUNCTION public.auto_index_source_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF (OLD.kind,OLD.canonical_url,OLD.owner_label,OLD.vendor_user_id) IS DISTINCT FROM
     (NEW.kind,NEW.canonical_url,NEW.owner_label,NEW.vendor_user_id) THEN
    RAISE EXCEPTION 'auto-index source identity is immutable';
  END IF;
  IF NEW.opted_out AND NOT OLD.opted_out THEN
    UPDATE public.components SET is_public=false WHERE id IN
      (SELECT component_id FROM public.auto_index_publications WHERE source_id=NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION public.auto_index_file_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  PERFORM 1 FROM public.auto_index_candidates WHERE id=NEW.candidate_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.auto_index_decisions WHERE candidate_id=NEW.candidate_id) THEN
    RAISE EXCEPTION 'candidate file set is already decided';
  END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION public.auto_index_decision_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates;
BEGIN
  SELECT * INTO c FROM public.auto_index_candidates WHERE id=NEW.candidate_id FOR UPDATE;
  IF NEW.outcome IN ('approved','qualified') AND
     (c.repository_url IS NULL OR c.license_spdx IS NULL OR c.license_text IS NULL OR
      NOT c.dependencies_approved OR
      NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_files WHERE candidate_id=NEW.candidate_id)) THEN
    RAISE EXCEPTION 'approved candidate lacks source or license evidence';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_source_guard BEFORE UPDATE ON public.auto_index_sources
FOR EACH ROW EXECUTE FUNCTION public.auto_index_source_guard();
CREATE TRIGGER auto_index_candidates_immutable BEFORE UPDATE OR DELETE ON public.auto_index_candidates
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();
CREATE TRIGGER auto_index_refresh_runs_immutable BEFORE UPDATE OR DELETE ON public.auto_index_refresh_runs
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();
CREATE TRIGGER auto_index_candidate_files_guard BEFORE INSERT ON public.auto_index_candidate_files
FOR EACH ROW EXECUTE FUNCTION public.auto_index_file_guard();
CREATE TRIGGER auto_index_candidate_files_immutable BEFORE UPDATE OR DELETE ON public.auto_index_candidate_files
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();
CREATE TRIGGER auto_index_candidate_demos_immutable BEFORE UPDATE OR DELETE ON public.auto_index_candidate_demos
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();
CREATE TRIGGER auto_index_candidate_assets_immutable BEFORE UPDATE OR DELETE ON public.auto_index_candidate_assets
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();
CREATE TRIGGER auto_index_decisions_immutable BEFORE UPDATE OR DELETE ON public.auto_index_decisions
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();
CREATE TRIGGER auto_index_decision_guard BEFORE INSERT ON public.auto_index_decisions
FOR EACH ROW EXECUTE FUNCTION public.auto_index_decision_guard();

CREATE FUNCTION public.auto_index_publication_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates; d public.auto_index_decisions; revoked public.auto_index_decisions; revoked_candidate public.auto_index_candidates;
BEGIN
  SELECT * INTO d FROM public.auto_index_decisions WHERE id=NEW.approved_decision_id;
  SELECT * INTO c FROM public.auto_index_candidates WHERE id=d.candidate_id;
  IF d.outcome IS DISTINCT FROM 'approved' OR c.source_id IS DISTINCT FROM NEW.source_id
     OR c.item_key IS DISTINCT FROM NEW.item_key
     OR NOT public.auto_index_candidate_provenance_complete(c.id)
     OR EXISTS (SELECT 1 FROM public.auto_index_sources s WHERE s.id=NEW.source_id AND s.opted_out)
     OR NOT EXISTS (SELECT 1 FROM public.components x JOIN public.users u ON u.id=x.user_id
                    JOIN public.auto_index_sources s ON s.id=NEW.source_id AND s.vendor_user_id=u.id
                    WHERE x.id=NEW.component_id AND u.manually_added
                    AND ((TG_OP='INSERT' AND NOT x.is_public) OR (TG_OP='UPDATE' AND x.is_public))
                    AND x.registry='auto-index' AND x.code<>'N/A') THEN
    RAISE EXCEPTION 'invalid auto-index publication';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.delisted_at IS NOT NULL OR OLD.superseded_at IS NOT NULL
       OR (NEW.source_id,NEW.item_key,NEW.component_id,NEW.approved_decision_id,NEW.published_at)
          IS DISTINCT FROM (OLD.source_id,OLD.item_key,OLD.component_id,OLD.approved_decision_id,OLD.published_at)
       OR NOT ((NEW.delisted_decision_id IS NOT NULL AND NEW.delisted_at IS NOT NULL AND NEW.superseded_at IS NULL)
            OR (NEW.delisted_decision_id IS NULL AND NEW.delisted_at IS NULL AND NEW.superseded_at IS NOT NULL)) THEN
      RAISE EXCEPTION 'publication history permits one terminal transition only';
    END IF;
  ELSIF NEW.delisted_decision_id IS NOT NULL OR NEW.delisted_at IS NOT NULL OR NEW.superseded_at IS NOT NULL THEN
    RAISE EXCEPTION 'new publication must start active';
  END IF;
  IF NEW.delisted_decision_id IS NOT NULL THEN
    SELECT * INTO revoked FROM public.auto_index_decisions WHERE id=NEW.delisted_decision_id;
    SELECT * INTO revoked_candidate FROM public.auto_index_candidates WHERE id=revoked.candidate_id;
    IF revoked.outcome IS DISTINCT FROM 'disqualified' OR revoked.reason_code IS DISTINCT FROM 'license_rejected'
       OR revoked_candidate.source_id IS DISTINCT FROM NEW.source_id
       OR revoked_candidate.item_key IS DISTINCT FROM NEW.item_key THEN
      RAISE EXCEPTION 'invalid delist decision';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_publication_guard BEFORE INSERT OR UPDATE ON public.auto_index_publications
FOR EACH ROW EXECUTE FUNCTION public.auto_index_publication_guard();
CREATE TRIGGER auto_index_publication_immutable_delete BEFORE DELETE ON public.auto_index_publications
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();
CREATE FUNCTION public.auto_index_publication_visibility() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.delisted_at IS NOT NULL OR NEW.superseded_at IS NOT NULL THEN
    UPDATE public.components SET is_public=false WHERE id=NEW.component_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_publication_visibility AFTER INSERT OR UPDATE ON public.auto_index_publications
FOR EACH ROW EXECUTE FUNCTION public.auto_index_publication_visibility();
CREATE FUNCTION public.auto_index_component_visibility_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.registry='auto-index' AND NEW.is_public AND NOT EXISTS (
    SELECT 1 FROM public.auto_index_publications p
    JOIN public.auto_index_sources s ON s.id=p.source_id
    JOIN public.auto_index_decisions d ON d.id=p.approved_decision_id
    JOIN public.auto_index_candidates c ON c.id=d.candidate_id
    WHERE p.component_id=NEW.id AND p.delisted_at IS NULL AND p.delisted_decision_id IS NULL
      AND p.superseded_at IS NULL
      AND NOT s.opted_out AND d.outcome='approved' AND c.source_id=p.source_id AND c.item_key=p.item_key
      AND public.auto_index_candidate_provenance_complete(c.id)) THEN
    RAISE EXCEPTION 'auto-index publication lacks complete provenance or is delisted';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_component_visibility_guard BEFORE UPDATE OF registry, is_public ON public.components
FOR EACH ROW EXECUTE FUNCTION public.auto_index_component_visibility_guard();
CREATE TRIGGER auto_index_component_visibility_insert_guard BEFORE INSERT ON public.components
FOR EACH ROW EXECUTE FUNCTION public.auto_index_component_visibility_guard();

-- One service-role transaction writes a candidate's complete immutable file set, then its decision.
CREATE FUNCTION public.record_auto_index_candidate(p_source_id bigint,p_item_key text,p_revision text,
  p_repository_url text,p_license_spdx text,p_license_text text,p_notice_text text,p_dependencies jsonb,p_files jsonb,
  p_outcome text,p_reason_code text,p_evidence jsonb DEFAULT '{}'::jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates; f jsonb; bytes_value bytea; decision_id bigint; stored_evidence jsonb;
  refresh_generation bigint; candidate_evidence jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.auto_index_sources WHERE id=p_source_id AND NOT opted_out) OR
     p_files IS NULL OR jsonb_typeof(p_files) IS DISTINCT FROM 'array' OR jsonb_array_length(p_files)>64 OR
     p_dependencies IS NULL OR jsonb_typeof(p_dependencies) IS DISTINCT FROM 'array' OR jsonb_array_length(p_dependencies)>128 OR
     (p_outcome IN ('approved','qualified') AND jsonb_array_length(p_files)=0) OR
     octet_length(p_files::text)>6000000 THEN RAISE EXCEPTION 'invalid candidate batch'; END IF;
  IF p_evidence ? 'refreshGeneration' THEN
    IF p_evidence->>'refreshGeneration' !~ '^[1-9][0-9]{0,17}$' THEN RAISE EXCEPTION 'invalid refresh generation'; END IF;
    refresh_generation:=(p_evidence->>'refreshGeneration')::bigint;
  ELSE
    SELECT candidate.refresh_generation INTO refresh_generation FROM public.auto_index_candidates candidate
      WHERE candidate.source_id=p_source_id AND candidate.item_key=p_item_key AND candidate.revision=p_revision;
    IF NOT FOUND THEN refresh_generation:=public.begin_auto_index_refresh(p_source_id,p_item_key,p_revision); END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.auto_index_refresh_runs run WHERE run.source_id=p_source_id
       AND run.item_key=p_item_key AND run.generation=refresh_generation AND run.revision=p_revision) THEN
    RAISE EXCEPTION 'refresh generation does not match selected revision';
  END IF;
  candidate_evidence:=coalesce(p_evidence,'{}'::jsonb)||jsonb_build_object('refreshGeneration',refresh_generation::text);
  INSERT INTO public.auto_index_candidates(source_id,item_key,revision,refresh_generation,component_source_path,repository_url,license_spdx,license_text,license_sha256,notice_text,dependencies,dependencies_approved)
  VALUES(p_source_id,p_item_key,p_revision,refresh_generation,coalesce(p_evidence->>'componentSourcePath',p_item_key),p_repository_url,p_license_spdx,p_license_text,
         CASE WHEN p_license_text IS NULL THEN NULL ELSE extensions.digest(convert_to(p_license_text,'UTF8'),'sha256') END,p_notice_text,p_dependencies,
         coalesce(p_evidence->>'dependenciesApproved'='true',false))
  ON CONFLICT(source_id,item_key,revision) DO NOTHING;
  SELECT * INTO STRICT c FROM public.auto_index_candidates
    WHERE source_id=p_source_id AND item_key=p_item_key AND revision=p_revision FOR UPDATE;
  IF c.component_source_path IS DISTINCT FROM coalesce(p_evidence->>'componentSourcePath',p_item_key) OR
     c.repository_url IS DISTINCT FROM p_repository_url OR c.license_spdx IS DISTINCT FROM p_license_spdx OR
     c.license_text IS DISTINCT FROM p_license_text OR c.notice_text IS DISTINCT FROM p_notice_text OR
     c.dependencies IS DISTINCT FROM p_dependencies OR
     c.refresh_generation IS DISTINCT FROM refresh_generation OR
     c.dependencies_approved IS DISTINCT FROM coalesce(p_evidence->>'dependenciesApproved'='true',false) THEN
    RAISE EXCEPTION 'candidate evidence conflict'; END IF;
  FOR f IN SELECT value FROM jsonb_array_elements(p_files) LOOP
    IF jsonb_typeof(f)<>'object' OR f->>'path' IS NULL OR f->>'bytes_hex' IS NULL OR
       (f->>'bytes_hex') !~ '^[a-f0-9]+$' OR length(f->>'bytes_hex')>4194304 THEN
      RAISE EXCEPTION 'invalid candidate file';
    END IF;
    bytes_value:=decode(f->>'bytes_hex','hex');
    IF NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_files WHERE candidate_id=c.id AND path=f->>'path') THEN
      INSERT INTO public.auto_index_candidate_files(candidate_id,path,registry_type,target,bytes,sha256)
      VALUES(c.id,f->>'path',coalesce(f->>'registry_type','registry:file'),f->>'target',bytes_value,extensions.digest(bytes_value,'sha256'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_files stored WHERE stored.candidate_id=c.id
      AND stored.path=f->>'path' AND stored.bytes=bytes_value AND stored.registry_type=coalesce(f->>'registry_type','registry:file')
      AND stored.target IS NOT DISTINCT FROM f->>'target') THEN RAISE EXCEPTION 'candidate file conflict'; END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.auto_index_candidate_files WHERE candidate_id=c.id)<>jsonb_array_length(p_files) THEN
    RAISE EXCEPTION 'candidate file-set conflict';
  END IF;
  INSERT INTO public.auto_index_decisions(candidate_id,outcome,reason_code,evidence,detector)
  VALUES(c.id,p_outcome,p_reason_code,candidate_evidence,p_evidence->>'detector')
  ON CONFLICT(candidate_id,outcome,reason_code) DO NOTHING;
  SELECT id,evidence INTO STRICT decision_id,stored_evidence FROM public.auto_index_decisions
    WHERE candidate_id=c.id AND outcome=p_outcome AND reason_code=p_reason_code;
  IF stored_evidence IS DISTINCT FROM candidate_evidence THEN RAISE EXCEPTION 'candidate decision evidence conflict'; END IF;
  RETURN decision_id;
END $$;

CREATE FUNCTION public.record_auto_index_candidate_demo(p_candidate_id bigint,p_demo_code text,
  p_provenance_class text,p_author_label text,p_source_url text,p_source_revision text,
  p_source_sha256 text,p_derivation text,p_control_settings jsonb,p_ghl_html_content text,
  p_ghl_source_fingerprint text,p_copy_prompts jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates; component_source text; expected_fingerprint text; demo_hash bytea; source_hash bytea;
BEGIN
  SELECT * INTO STRICT c FROM public.auto_index_candidates WHERE id=p_candidate_id;
  SELECT convert_from(f.bytes,'UTF8') INTO STRICT component_source FROM public.auto_index_candidate_files f
    WHERE f.candidate_id=c.id AND f.path=coalesce(c.component_source_path,c.item_key);
  IF NOT c.dependencies_approved OR p_provenance_class NOT IN ('upstream-original','license-permitted-adaptation','higherbits-authored') OR
     length(p_author_label) NOT BETWEEN 1 AND 200 OR length(p_demo_code)=0 OR octet_length(p_demo_code)>2097152 OR
     length(p_derivation) NOT BETWEEN 1 AND 4000 OR jsonb_typeof(p_control_settings) IS DISTINCT FROM 'object' OR
     octet_length(p_control_settings::text)>16384 OR length(p_ghl_html_content)=0 OR octet_length(p_ghl_html_content)>1048576 OR
     p_ghl_source_fingerprint !~ '^[a-f0-9]{64}$' OR jsonb_typeof(p_copy_prompts) IS DISTINCT FROM 'object' OR
     octet_length(p_copy_prompts::text)>8388608 OR
     (SELECT count(*) FROM jsonb_object_keys(p_copy_prompts))<>10 OR
     EXISTS (SELECT 1 FROM jsonb_each(p_copy_prompts) prompt WHERE prompt.key NOT IN
       ('sitebrew','v0','lovable','bolt','extended','replit','magic_patterns','claude','codex','antigravity')
       OR jsonb_typeof(prompt.value)<>'string' OR length(prompt.value #>> '{}')=0 OR
       octet_length(prompt.value #>> '{}')>2097152) THEN RAISE EXCEPTION 'incomplete private demo evidence'; END IF;
  IF p_provenance_class='higherbits-authored' THEN
    IF p_source_url IS NOT NULL OR p_source_revision IS NOT NULL OR p_source_sha256 IS NOT NULL THEN RAISE EXCEPTION 'authored demo has upstream locator'; END IF;
    source_hash:=NULL;
  ELSE
    IF p_source_url !~ '^https://github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/|$)' OR
       p_source_revision !~ '^[a-f0-9]{40,64}$' OR p_source_sha256 !~ '^[a-f0-9]{64}$' THEN
      RAISE EXCEPTION 'upstream demo provenance is incomplete';
    END IF;
    source_hash:=decode(p_source_sha256,'hex');
  END IF;
  expected_fingerprint:=public.auto_index_ghl_fingerprint(component_source,p_demo_code);
  IF p_ghl_source_fingerprint IS DISTINCT FROM expected_fingerprint THEN RAISE EXCEPTION 'stale staged GHL output'; END IF;
  demo_hash:=extensions.digest(convert_to(p_demo_code,'UTF8'),'sha256');
  IF p_provenance_class='upstream-original' AND source_hash IS DISTINCT FROM demo_hash THEN
    RAISE EXCEPTION 'original demo source hash mismatch';
  END IF;
  INSERT INTO public.auto_index_candidate_demos(candidate_id,demo_code,demo_sha256,provenance_class,author_label,
    source_url,source_revision,source_sha256,derivation,control_settings,ghl_html_content,ghl_source_fingerprint,copy_prompts)
  VALUES(p_candidate_id,p_demo_code,demo_hash,p_provenance_class,p_author_label,p_source_url,p_source_revision,
    source_hash,p_derivation,p_control_settings,p_ghl_html_content,p_ghl_source_fingerprint,p_copy_prompts)
  ON CONFLICT(candidate_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_demos d WHERE d.candidate_id=p_candidate_id AND
    d.demo_code=p_demo_code AND d.demo_sha256=demo_hash AND d.provenance_class=p_provenance_class AND
    d.author_label=p_author_label AND d.source_url IS NOT DISTINCT FROM p_source_url AND
    d.source_revision IS NOT DISTINCT FROM p_source_revision AND d.source_sha256 IS NOT DISTINCT FROM source_hash AND
    d.derivation=p_derivation AND d.control_settings=p_control_settings AND d.ghl_html_content=p_ghl_html_content AND
    d.ghl_source_fingerprint=p_ghl_source_fingerprint AND d.copy_prompts=p_copy_prompts) THEN RAISE EXCEPTION 'candidate demo evidence conflict'; END IF;
END $$;

CREATE FUNCTION public.record_auto_index_candidate_asset(p_candidate_id bigint,p_asset_key text,p_asset_role text,
  p_provenance_class text,p_source_url text,p_source_revision text,p_asset_sha256 text,p_license_spdx text,
  p_license_text text,p_notice_text text,p_derivation text,p_source_asset_key text,p_source_asset_sha256 text,p_transform_record jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE asset_hash bytea; license_hash bytea; notice_hash bytea; source_asset_hash bytea;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.auto_index_candidates WHERE id=p_candidate_id AND dependencies_approved) OR
     p_asset_key IS NULL OR length(p_asset_key) NOT BETWEEN 1 AND 256 OR p_asset_key !~ '^[A-Za-z0-9_./-]+$' OR
     p_asset_key ~ '(^/|(^|/)\.\.(/|$))' OR
     p_asset_role NOT IN ('component_source','demo_source','stylesheet','font','image','license','notice') OR
     p_provenance_class NOT IN ('upstream-original','license-permitted-adaptation','higherbits-authored') OR
     p_asset_sha256 !~ '^[a-f0-9]{64}$' OR p_license_spdx NOT IN ('MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0','ISC') OR
     length(p_license_text)=0 OR octet_length(p_license_text)>262144 OR p_notice_text IS NULL OR
     octet_length(p_notice_text)>262144 OR length(p_derivation) NOT BETWEEN 1 AND 4000 OR
     (p_provenance_class='license-permitted-adaptation' AND
       (p_source_asset_key IS NULL OR p_source_asset_key !~ '^[A-Za-z0-9_./-]+$' OR p_source_asset_key ~ '(^/|(^|/)\.\.(/|$))' OR
        p_source_asset_sha256 IS NULL OR p_source_asset_sha256 !~ '^[a-f0-9]{64}$' OR p_transform_record IS NULL OR jsonb_typeof(p_transform_record)<>'object' OR
        NOT (p_transform_record ?& ARRAY['sourceAssetKey','sourceSha256','outputSha256','operation']) OR
        p_transform_record-ARRAY['sourceAssetKey','sourceSha256','outputSha256','operation']<>'{}'::jsonb OR
        p_transform_record->>'sourceAssetKey' IS DISTINCT FROM p_source_asset_key OR
        p_transform_record->>'sourceSha256' IS DISTINCT FROM p_source_asset_sha256 OR
        p_transform_record->>'outputSha256' IS DISTINCT FROM p_asset_sha256 OR
        jsonb_typeof(p_transform_record->'operation')<>'string' OR length(p_transform_record->>'operation') NOT BETWEEN 1 AND 1000 OR
        p_transform_record->>'operation' IS DISTINCT FROM p_derivation)) OR
     (p_provenance_class<>'license-permitted-adaptation' AND
       (p_source_asset_key IS NOT NULL OR p_source_asset_sha256 IS NOT NULL OR p_transform_record IS NOT NULL)) THEN
    RAISE EXCEPTION 'incomplete per-asset evidence';
  END IF;
  IF p_provenance_class='higherbits-authored' THEN
    IF p_source_url IS NOT NULL OR p_source_revision IS NOT NULL THEN RAISE EXCEPTION 'authored asset has upstream locator'; END IF;
  ELSIF p_source_url !~ '^https://github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/|$)' OR
        p_source_revision !~ '^[a-f0-9]{40,64}$' THEN
    RAISE EXCEPTION 'upstream asset provenance is incomplete';
  END IF;
  asset_hash:=decode(p_asset_sha256,'hex');
  IF p_source_asset_sha256 IS NOT NULL THEN source_asset_hash:=decode(p_source_asset_sha256,'hex'); END IF;
  license_hash:=extensions.digest(convert_to(p_license_text,'UTF8'),'sha256');
  notice_hash:=extensions.digest(convert_to(p_notice_text,'UTF8'),'sha256');
  INSERT INTO public.auto_index_candidate_assets(candidate_id,asset_key,asset_role,provenance_class,source_url,
    source_revision,asset_sha256,license_spdx,license_text,license_sha256,notice_text,notice_sha256,derivation,
    source_asset_key,source_asset_sha256,transform_record)
  VALUES(p_candidate_id,p_asset_key,p_asset_role,p_provenance_class,p_source_url,p_source_revision,asset_hash,
    p_license_spdx,p_license_text,license_hash,p_notice_text,notice_hash,p_derivation,p_source_asset_key,source_asset_hash,p_transform_record)
  ON CONFLICT(candidate_id,asset_key) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_assets a WHERE a.candidate_id=p_candidate_id AND
    a.asset_key=p_asset_key AND a.asset_role=p_asset_role AND a.provenance_class=p_provenance_class AND
    a.source_url IS NOT DISTINCT FROM p_source_url AND a.source_revision IS NOT DISTINCT FROM p_source_revision AND
    a.asset_sha256=asset_hash AND a.license_spdx=p_license_spdx AND a.license_text=p_license_text AND
    a.license_sha256=license_hash AND a.notice_text=p_notice_text AND a.notice_sha256=notice_hash AND a.derivation=p_derivation AND
    a.source_asset_key IS NOT DISTINCT FROM p_source_asset_key AND a.source_asset_sha256 IS NOT DISTINCT FROM source_asset_hash AND
    a.transform_record IS NOT DISTINCT FROM p_transform_record) THEN
    RAISE EXCEPTION 'candidate asset evidence conflict';
  END IF;
END $$;

-- Service-only local/production promotion. The approved decision fixes the bytes and
-- sidecars; a component row never receives a mutable upstream URL as its source.
CREATE FUNCTION public.publish_auto_index_candidate(p_approved_decision_id bigint,p_slug text,
  p_title text,p_description text,p_preview_url text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE d public.auto_index_decisions; c public.auto_index_candidates; s public.auto_index_sources;
  demo_artifact public.auto_index_candidate_demos; component_id integer; source_code text; registry_files jsonb; license_target text; notice_target text;
  active_component_id integer; active_candidate_generation bigint; active_demo_id bigint;
  refresh_state public.auto_index_refresh_state; superseded_count integer; updated_count integer;
BEGIN
  SELECT * INTO STRICT d FROM public.auto_index_decisions WHERE id=p_approved_decision_id;
  SELECT * INTO STRICT c FROM public.auto_index_candidates WHERE id=d.candidate_id;
  SELECT * INTO STRICT s FROM public.auto_index_sources WHERE id=c.source_id FOR UPDATE;
  -- A confirmed delist is a source/item latch: no historical retry may restore visibility.
  IF EXISTS (SELECT 1 FROM public.auto_index_publications p
    WHERE p.source_id=c.source_id AND p.item_key=c.item_key AND p.delisted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'publication already delisted; retry cannot restore it';
  END IF;
  -- A retry of the active approved decision returns its already-public component.
  SELECT p.component_id INTO component_id FROM public.auto_index_publications p
    JOIN public.components existing ON existing.id=p.component_id
    WHERE p.source_id=c.source_id AND p.item_key=c.item_key AND p.approved_decision_id=d.id
      AND p.delisted_at IS NULL AND p.superseded_at IS NULL AND existing.is_public;
  IF FOUND THEN RETURN component_id; END IF;
  SELECT * INTO STRICT refresh_state FROM public.auto_index_refresh_state state
    WHERE state.source_id=c.source_id AND state.item_key=c.item_key FOR UPDATE;
  IF c.refresh_generation IS NULL OR c.refresh_generation IS DISTINCT FROM refresh_state.current_generation
     OR c.revision IS DISTINCT FROM refresh_state.latest_revision THEN
    RAISE EXCEPTION 'stale auto-index refresh completion';
  END IF;
  SELECT p.component_id,active_candidate.refresh_generation INTO active_component_id,active_candidate_generation
    FROM public.auto_index_publications p
    JOIN public.auto_index_decisions active_decision ON active_decision.id=p.approved_decision_id
    JOIN public.auto_index_candidates active_candidate ON active_candidate.id=active_decision.candidate_id
    WHERE p.source_id=c.source_id AND p.item_key=c.item_key
      AND p.delisted_at IS NULL AND p.superseded_at IS NULL
    FOR UPDATE OF p;
  IF d.outcome<>'approved' OR s.opted_out OR c.repository_url IS NULL OR c.license_spdx IS NULL
     OR c.license_text IS NULL OR NOT public.auto_index_candidate_provenance_complete(c.id)
     OR p_slug !~ '^[a-z0-9][a-z0-9-]{0,79}$'
     OR length(p_title) NOT BETWEEN 1 AND 160 OR length(p_description)>1000
     OR p_preview_url !~ '^https://[^[:space:]]+$'
     OR EXISTS (SELECT 1 FROM public.auto_index_publications WHERE source_id=c.source_id AND item_key=c.item_key AND approved_decision_id=d.id)
     OR (active_candidate_generation IS NOT NULL AND c.refresh_generation<=active_candidate_generation)
     OR (active_component_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.components existing
       WHERE existing.id=active_component_id AND existing.user_id=s.vendor_user_id
         AND existing.component_slug=p_slug AND existing.registry='auto-index'))
     OR EXISTS (SELECT 1 FROM public.components existing WHERE existing.user_id=s.vendor_user_id
       AND existing.component_slug=p_slug AND existing.id IS DISTINCT FROM active_component_id) THEN
    RAISE EXCEPTION 'invalid auto-index promotion';
  END IF;
  SELECT convert_from(f.bytes,'UTF8') INTO source_code FROM public.auto_index_candidate_files f
    WHERE f.candidate_id=c.id AND f.path=coalesce(c.component_source_path,c.item_key);
  SELECT * INTO STRICT demo_artifact FROM public.auto_index_candidate_demos WHERE candidate_id=c.id;
  SELECT jsonb_agg(jsonb_build_object('path',f.path,'type',f.registry_type,'content',convert_from(f.bytes,'UTF8')) ||
                   CASE WHEN f.target IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('target',f.target) END ORDER BY f.path)
    INTO registry_files FROM public.auto_index_candidate_files f WHERE f.candidate_id=c.id;
  license_target:='higherbits/licenses/'||p_slug||'-'||encode(c.license_sha256,'hex')||'.LICENSE';
  registry_files:=registry_files||jsonb_build_array(jsonb_build_object('path',license_target,'target',license_target,
    'type','registry:file','content',c.license_text));
  IF c.notice_text IS NOT NULL THEN
    notice_target:='higherbits/licenses/'||p_slug||'-'||encode(extensions.digest(convert_to(c.notice_text,'UTF8'),'sha256'),'hex')||'.NOTICE';
    registry_files:=registry_files||jsonb_build_array(jsonb_build_object('path',notice_target,'target',notice_target,
      'type','registry:file','content',c.notice_text));
  END IF;
  IF active_component_id IS NOT NULL THEN
    UPDATE public.auto_index_publications publication SET superseded_at=now()
      WHERE publication.source_id=c.source_id AND publication.item_key=c.item_key
        AND publication.delisted_at IS NULL AND publication.superseded_at IS NULL
        AND publication.component_id=active_component_id;
    GET DIAGNOSTICS superseded_count=ROW_COUNT;
    IF superseded_count<>1 THEN RAISE EXCEPTION 'active publication changed during revision switch'; END IF;
    SELECT demo.id INTO active_demo_id FROM public.demos demo
      WHERE demo.component_id=active_component_id AND demo.user_id=s.vendor_user_id AND demo.demo_slug='default'
      FOR UPDATE;
    IF NOT FOUND OR (SELECT count(*) FROM public.demos demo WHERE demo.component_id=active_component_id AND demo.demo_slug='default')<>1 THEN
      RAISE EXCEPTION 'stable auto-index component has no unique default demo';
    END IF;
    UPDATE public.components component SET component_names=jsonb_build_array(p_title),name=p_title,
      description=p_description,preview_url=p_preview_url,code=source_code,
      registry_url=jsonb_build_object('name',p_slug,'type','registry:ui','files',registry_files)::text,
      license=lower(c.license_spdx),is_public=false
      WHERE component.id=active_component_id AND component.user_id=s.vendor_user_id
        AND component.component_slug=p_slug AND component.registry='auto-index';
    GET DIAGNOSTICS updated_count=ROW_COUNT;
    IF updated_count<>1 THEN RAISE EXCEPTION 'stable auto-index component changed during revision switch'; END IF;
    UPDATE public.demos demo SET demo_code=demo_artifact.demo_code,name=p_title,
      ghl_html_content=demo_artifact.ghl_html_content,ghl_source_fingerprint=demo_artifact.ghl_source_fingerprint
      WHERE demo.id=active_demo_id AND demo.component_id=active_component_id;
    GET DIAGNOSTICS updated_count=ROW_COUNT;
    IF updated_count<>1 THEN RAISE EXCEPTION 'stable auto-index demo changed during revision switch'; END IF;
    component_id:=active_component_id;
  ELSE
    INSERT INTO public.components(component_names,user_id,component_slug,name,description,preview_url,
                                  registry,code,registry_url,license,is_public)
    VALUES(jsonb_build_array(p_title),s.vendor_user_id,p_slug,p_title,p_description,p_preview_url,
           'auto-index',source_code,jsonb_build_object('name',p_slug,'type','registry:ui','files',registry_files)::text,
           lower(c.license_spdx),false) RETURNING id INTO component_id;
    INSERT INTO public.demos(component_id,user_id,demo_code,name,demo_slug,ghl_html_content,ghl_source_fingerprint)
    VALUES(component_id,s.vendor_user_id,demo_artifact.demo_code,p_title,'default',
           demo_artifact.ghl_html_content,demo_artifact.ghl_source_fingerprint)
    RETURNING id INTO active_demo_id;
  END IF;
  DELETE FROM public.auto_index_copy_prompts WHERE demo_id=active_demo_id;
  INSERT INTO public.auto_index_copy_prompts(demo_id,prompt_type,prompt,source_fingerprint)
  SELECT active_demo_id,prompt.key,prompt.value,demo_artifact.ghl_source_fingerprint
    FROM jsonb_each_text(demo_artifact.copy_prompts) prompt;
  IF (SELECT count(*) FROM public.auto_index_copy_prompts WHERE demo_id=active_demo_id)<>10 THEN
    RAISE EXCEPTION 'incomplete auto-index copy prompts'; END IF;
  INSERT INTO public.auto_index_publications(source_id,item_key,component_id,approved_decision_id)
  VALUES(c.source_id,c.item_key,component_id,d.id);
  UPDATE public.components SET is_public=true WHERE id=component_id;
  RETURN component_id;
END $$;

-- Only an explicit, persisted rejected-license decision can revoke a published item.
-- Ordinary fetch failures never change its last approved snapshot.
CREATE FUNCTION public.delist_auto_index_rejected_license(p_decision_id bigint)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE d public.auto_index_decisions; c public.auto_index_candidates; p public.auto_index_publications;
BEGIN
  SELECT * INTO STRICT d FROM public.auto_index_decisions WHERE id=p_decision_id;
  SELECT * INTO STRICT c FROM public.auto_index_candidates WHERE id=d.candidate_id;
  IF d.outcome<>'disqualified' OR d.reason_code<>'license_rejected' THEN
    RAISE EXCEPTION 'not a confirmed rejected-license decision';
  END IF;
  PERFORM 1 FROM public.auto_index_sources WHERE id=c.source_id FOR UPDATE;
  SELECT * INTO p FROM public.auto_index_publications
    WHERE source_id=c.source_id AND item_key=c.item_key AND delisted_decision_id=p_decision_id FOR UPDATE;
  IF FOUND THEN RETURN p.component_id; END IF;
  IF EXISTS (SELECT 1 FROM public.auto_index_publications
      WHERE source_id=c.source_id AND item_key=c.item_key AND delisted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'publication already delisted by another decision';
  END IF;
  SELECT * INTO STRICT p FROM public.auto_index_publications
    WHERE source_id=c.source_id AND item_key=c.item_key AND delisted_at IS NULL AND superseded_at IS NULL FOR UPDATE;
  UPDATE public.auto_index_publications
    SET delisted_decision_id=p_decision_id,delisted_at=now()
    WHERE source_id=c.source_id AND item_key=c.item_key AND component_id=p.component_id
      AND delisted_at IS NULL AND superseded_at IS NULL;
  RETURN p.component_id;
END $$;

-- Claims are serialized by the per-owner/demo primary key. Released and expired
-- rows remain so the fencing generation cannot reset for a later lease.
CREATE FUNCTION public.claim_sandbox_ghl_review_lease(
  p_user_id text,p_demo_id bigint,p_input_fingerprint text,p_owner_token uuid,p_lease_seconds integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE acquired_generation bigint; current_lease public.sandbox_ghl_review_leases;
  saved_fingerprint text; saved_html text;
BEGIN
  IF p_user_id IS NULL OR p_demo_id IS NULL OR p_input_fingerprint !~ '^[a-f0-9]{64}$' OR
     p_owner_token IS NULL OR p_lease_seconds NOT BETWEEN 10 AND 180 THEN
    RAISE EXCEPTION 'invalid sandbox GHL lease request';
  END IF;
  PERFORM 1 FROM public.demos demo JOIN public.components component ON component.id=demo.component_id
    WHERE demo.id=p_demo_id AND demo.user_id=p_user_id AND component.user_id=p_user_id
    FOR KEY SHARE OF demo,component;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','forbidden'); END IF;

  INSERT INTO public.sandbox_ghl_review_leases(user_id,demo_id,fencing_generation)
    VALUES(p_user_id,p_demo_id,0) ON CONFLICT(user_id,demo_id) DO NOTHING;
  SELECT lease.* INTO STRICT current_lease FROM public.sandbox_ghl_review_leases lease
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id FOR UPDATE;
  IF current_lease.owner_token IS NOT NULL AND current_lease.lease_expires_at>clock_timestamp() THEN
    IF current_lease.input_fingerprint=p_input_fingerprint THEN
      RETURN jsonb_build_object('status','pending','fencing_generation',current_lease.fencing_generation,
        'retry_after_seconds',LEAST(5,GREATEST(1,ceil(extract(epoch FROM
          (current_lease.lease_expires_at-clock_timestamp())))::integer)));
    END IF;
    RETURN jsonb_build_object('status','conflict','fencing_generation',current_lease.fencing_generation);
  END IF;
  SELECT demo.ghl_source_fingerprint,demo.ghl_html_content INTO saved_fingerprint,saved_html
    FROM public.demos demo WHERE demo.id=p_demo_id AND demo.user_id=p_user_id;
  IF saved_fingerprint=p_input_fingerprint AND saved_html IS NOT NULL AND length(saved_html)>0 THEN
    RETURN jsonb_build_object('status','saved');
  END IF;
  UPDATE public.sandbox_ghl_review_leases lease SET input_fingerprint=p_input_fingerprint,
    owner_token=p_owner_token,fencing_generation=lease.fencing_generation+1,
    lease_expires_at=clock_timestamp()+make_interval(secs=>p_lease_seconds),updated_at=clock_timestamp()
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id
    RETURNING lease.fencing_generation INTO acquired_generation;
  RETURN jsonb_build_object('status','acquired','fencing_generation',acquired_generation);
END $$;

CREATE FUNCTION public.release_sandbox_ghl_review_lease(
  p_user_id text,p_demo_id bigint,p_input_fingerprint text,p_owner_token uuid,p_fencing_generation bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE released_count integer;
BEGIN
  UPDATE public.sandbox_ghl_review_leases lease SET input_fingerprint=NULL,owner_token=NULL,
    lease_expires_at=NULL,updated_at=clock_timestamp()
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id AND
      lease.input_fingerprint=p_input_fingerprint AND lease.owner_token=p_owner_token AND
      lease.fencing_generation=p_fencing_generation;
  GET DIAGNOSTICS released_count=ROW_COUNT;
  RETURN released_count=1;
END $$;

-- Output replacement and lease completion share one transaction while the
-- current owner token, fingerprint, generation and expiry are locked.
CREATE FUNCTION public.persist_sandbox_ghl_review_output(
  p_user_id text,p_demo_id bigint,p_input_fingerprint text,p_owner_token uuid,
  p_fencing_generation bigint,p_html text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_lease public.sandbox_ghl_review_leases; updated_count integer;
BEGIN
  IF p_html IS NULL OR octet_length(p_html)=0 OR octet_length(p_html)>2097152 THEN
    RAISE EXCEPTION 'invalid sandbox GHL output';
  END IF;
  SELECT lease.* INTO current_lease FROM public.sandbox_ghl_review_leases lease
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id FOR UPDATE;
  IF NOT FOUND OR current_lease.input_fingerprint IS DISTINCT FROM p_input_fingerprint OR
     current_lease.owner_token IS DISTINCT FROM p_owner_token OR
     current_lease.fencing_generation IS DISTINCT FROM p_fencing_generation OR
     current_lease.lease_expires_at<=clock_timestamp() THEN
    RETURN false;
  END IF;
  UPDATE public.demos demo SET ghl_html_content=p_html,ghl_source_fingerprint=p_input_fingerprint
    FROM public.components component
    WHERE demo.id=p_demo_id AND demo.component_id=component.id AND demo.user_id=p_user_id AND component.user_id=p_user_id;
  GET DIAGNOSTICS updated_count=ROW_COUNT;
  IF updated_count<>1 THEN RETURN false; END IF;
  UPDATE public.sandbox_ghl_review_leases lease SET input_fingerprint=NULL,owner_token=NULL,
    lease_expires_at=NULL,updated_at=clock_timestamp()
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id AND
      lease.input_fingerprint=p_input_fingerprint AND lease.owner_token=p_owner_token AND
      lease.fencing_generation=p_fencing_generation;
  GET DIAGNOSTICS updated_count=ROW_COUNT;
  IF updated_count<>1 THEN RAISE EXCEPTION 'sandbox GHL lease changed during output persistence'; END IF;
  RETURN true;
END $$;

ALTER TABLE public.auto_index_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_refresh_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_refresh_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_candidate_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_candidate_demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_copy_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_candidate_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_ghl_review_leases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auto_index_sources,public.auto_index_refresh_state,public.auto_index_refresh_runs,public.auto_index_candidates,public.auto_index_candidate_files,public.auto_index_candidate_demos,public.auto_index_candidate_assets,public.auto_index_decisions,public.auto_index_publications FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON public.auto_index_copy_prompts FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON public.sandbox_ghl_review_leases FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON public.auto_index_publications FROM service_role;
REVOKE ALL ON SEQUENCE public.auto_index_sources_id_seq,public.auto_index_candidates_id_seq,public.auto_index_decisions_id_seq FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.auto_index_sources TO service_role;
GRANT SELECT,INSERT ON public.auto_index_candidates,public.auto_index_candidate_files,public.auto_index_decisions TO service_role;
GRANT SELECT,INSERT ON public.auto_index_candidate_demos,public.auto_index_candidate_assets TO service_role;
GRANT SELECT,INSERT,DELETE ON public.auto_index_copy_prompts TO service_role;
GRANT SELECT ON public.auto_index_publications TO service_role;
GRANT USAGE ON SEQUENCE public.auto_index_sources_id_seq,public.auto_index_candidates_id_seq,public.auto_index_decisions_id_seq TO service_role;
REVOKE ALL ON FUNCTION public.auto_index_history_immutable(),public.auto_index_source_guard(),public.auto_index_file_guard(),public.auto_index_decision_guard(),public.auto_index_publication_guard(),public.auto_index_publication_visibility(),public.auto_index_component_visibility_guard() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.register_auto_index_source(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_auto_index_source(text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.begin_auto_index_refresh(bigint,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_auto_index_refresh(bigint,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.record_auto_index_candidate(bigint,text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_auto_index_candidate(bigint,text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.record_auto_index_candidate_demo(bigint,text,text,text,text,text,text,text,jsonb,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_auto_index_candidate_demo(bigint,text,text,text,text,text,text,text,jsonb,text,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.record_auto_index_candidate_asset(bigint,text,text,text,text,text,text,text,text,text,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_auto_index_candidate_asset(bigint,text,text,text,text,text,text,text,text,text,text,text,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.auto_index_ghl_fingerprint(text,text),public.auto_index_candidate_provenance_complete(bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.auto_index_ghl_fingerprint(text,text),public.auto_index_candidate_provenance_complete(bigint) TO service_role;
REVOKE ALL ON FUNCTION public.publish_auto_index_candidate(bigint,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_auto_index_candidate(bigint,text,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.delist_auto_index_rejected_license(bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delist_auto_index_rejected_license(bigint) TO service_role;
REVOKE ALL ON FUNCTION public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer),
  public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint),
  public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer),
  public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint),
  public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text) TO service_role;

-- The public route accepts either column. Reserve both in one case-insensitive
-- namespace, including writes from Clerk and profile settings outside auto-index.
CREATE FUNCTION public.guard_public_user_handles() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE handle text;
BEGIN
  IF TG_OP='UPDATE' AND lower(NEW.username) IS NOT DISTINCT FROM lower(OLD.username)
      AND lower(NEW.display_username) IS NOT DISTINCT FROM lower(OLD.display_username) THEN RETURN NEW; END IF;
  FOR handle IN SELECT DISTINCT lower(value) FROM unnest(ARRAY[NEW.username,NEW.display_username]) value
    WHERE value IS NOT NULL AND value<>'' ORDER BY 1 LOOP
    PERFORM pg_catalog.pg_advisory_xact_lock(20260929,pg_catalog.hashtext(handle));
    IF EXISTS (SELECT 1 FROM public.users u WHERE u.id<>NEW.id
      AND (lower(u.username)=handle OR lower(u.display_username)=handle)) THEN
      RAISE EXCEPTION 'public handle already taken: %',handle USING ERRCODE='23505';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_public_user_handles() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER users_public_handle_guard BEFORE INSERT OR UPDATE OF username,display_username ON public.users
FOR EACH ROW EXECUTE FUNCTION public.guard_public_user_handles();
DO $$
DECLARE duplicate_handle text;
BEGIN
  SELECT handle INTO duplicate_handle FROM (
    SELECT id,lower(username) AS handle FROM public.users WHERE username IS NOT NULL AND username<>''
    UNION ALL
    SELECT id,lower(display_username) FROM public.users WHERE display_username IS NOT NULL AND display_username<>''
  ) handles GROUP BY handle HAVING count(DISTINCT id)>1 LIMIT 1;
  IF duplicate_handle IS NOT NULL THEN RAISE EXCEPTION 'existing public handle collision: %',duplicate_handle; END IF;
END $$;
COMMIT;
