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
  scraping_status text,
  scraping_note text,
  birth_date text,
  chapter_list ARRAY,
  volume_list ARRAY,
  appearance_count integer,
  volume_appearance_count integer,
  first_appearance integer,
  last_appearance integer,
  arc_list ARRAY,
  saga_list ARRAY,
  CONSTRAINT character_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cov (
  volume integer,
  character text
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
