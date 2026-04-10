-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.arc (
  arc_id text NOT NULL,
  title text NOT NULL,
  japanese_title text,
  romanized_title text,
  start_chapter integer NOT NULL,
  end_chapter integer NOT NULL,
  saga_id text,
  description text,
  CONSTRAINT arc_pkey PRIMARY KEY (arc_id),
  CONSTRAINT fk_arc_saga FOREIGN KEY (saga_id) REFERENCES public.saga(saga_id)
);
CREATE TABLE public.chapter (
  number integer NOT NULL,
  volume integer,
  title text,
  num_page integer,
  date date,
  jump text,
  CONSTRAINT chapter_pkey PRIMARY KEY (number)
);
CREATE TABLE public.character (
  id text NOT NULL,
  name text,
  origin text,
  status text,
  birth text,
  blood_type text,
  blood_type_group text,
  bounties text,
  bounty bigint,
  age integer,
  is_likely_character boolean,
  scraping_status text,
  scraping_note text,
  chapter_list ARRAY,
  volume_list ARRAY,
  arc_list ARRAY,
  saga_list ARRAY,
  appearance_count integer,
  volume_appearance_count integer,
  first_appearance integer,
  last_appearance integer,
  birth_date text,
  cover_volume_list ARRAY,
  cover_appearance_count integer,
  origin_region text,
  CONSTRAINT character_pkey PRIMARY KEY (id)
);
CREATE TABLE public.character_affiliation (
  character_id text NOT NULL,
  group_name text NOT NULL,
  sub_group text,
  status text NOT NULL,
  CONSTRAINT character_affiliation_pkey PRIMARY KEY (character_id, group_name)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text DEFAULT (chr(39) || chr(39)),
  email text,
  avatar_url text DEFAULT (chr(39) || chr(39)),
  ai_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.saga (
  saga_id text NOT NULL,
  title text NOT NULL,
  japanese_title text,
  romanized_title text,
  start_chapter integer NOT NULL,
  end_chapter integer NOT NULL,
  description text,
  CONSTRAINT saga_pkey PRIMARY KEY (saga_id)
);
CREATE TABLE public.volume (
  number integer NOT NULL,
  title text,
  CONSTRAINT volume_pkey PRIMARY KEY (number)
);
CREATE TABLE public.wiki_chunks (
  chunk_id text NOT NULL,
  page_id text,
  page_type text,
  title text,
  section_name text,
  chunk_text text,
  metadata jsonb,
  CONSTRAINT wiki_chunks_pkey PRIMARY KEY (chunk_id)
);
CREATE TABLE public.wiki_text (
  page_id text NOT NULL,
  page_type text NOT NULL,
  title text NOT NULL,
  intro_text text,
  full_text text,
  sections jsonb,
  scraped_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wiki_text_pkey PRIMARY KEY (page_id)
);
