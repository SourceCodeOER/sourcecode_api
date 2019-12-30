--
-- PostgreSQL database dump
--

-- Dumped from database version 12.0
-- Dumped by pg_dump version 12.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: exercises_library; Type: SCHEMA; Schema: -; Owner: postgres
--

--
-- Name: enum_Users_role; Type: TYPE; Schema: exercises_library; Owner: postgres
--

CREATE TYPE exercises_library."enum_Users_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE exercises_library."enum_Users_role" OWNER TO postgres;

-- This line is not accepted on travis
SET default_table_access_method = heap;

--
-- Name: Configurations; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Configurations" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE exercises_library."Configurations" OWNER TO postgres;

--
-- Name: Configurations_Tags; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Configurations_Tags" (
    configuration_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE exercises_library."Configurations_Tags" OWNER TO postgres;

--
-- Name: Configurations_id_seq; Type: SEQUENCE; Schema: exercises_library; Owner: postgres
--

CREATE SEQUENCE exercises_library."Configurations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE exercises_library."Configurations_id_seq" OWNER TO postgres;

--
-- Name: Configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Configurations_id_seq" OWNED BY exercises_library."Configurations".id;


--
-- Name: Exercises; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Exercises" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text DEFAULT ''::text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE exercises_library."Exercises" OWNER TO postgres;

--
-- Name: Exercises_Metrics; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Exercises_Metrics" (
    id integer NOT NULL,
    vote_count integer DEFAULT 0 NOT NULL,
    avg_vote_score numeric(3,2) DEFAULT 0 NOT NULL,
    tags_ids integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
    exercise_id integer NOT NULL
);


ALTER TABLE exercises_library."Exercises_Metrics" OWNER TO postgres;

--
-- Name: Exercises_Metrics_id_seq; Type: SEQUENCE; Schema: exercises_library; Owner: postgres
--

CREATE SEQUENCE exercises_library."Exercises_Metrics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE exercises_library."Exercises_Metrics_id_seq" OWNER TO postgres;

--
-- Name: Exercises_Metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Exercises_Metrics_id_seq" OWNED BY exercises_library."Exercises_Metrics".id;


--
-- Name: Exercises_Tags; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Exercises_Tags" (
    exercise_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE exercises_library."Exercises_Tags" OWNER TO postgres;

--
-- Name: Exercises_id_seq; Type: SEQUENCE; Schema: exercises_library; Owner: postgres
--

CREATE SEQUENCE exercises_library."Exercises_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE exercises_library."Exercises_id_seq" OWNER TO postgres;

--
-- Name: Exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Exercises_id_seq" OWNED BY exercises_library."Exercises".id;


--
-- Name: Notations; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Notations" (
    id integer NOT NULL,
    note numeric(3,2) NOT NULL,
    exercise_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE exercises_library."Notations" OWNER TO postgres;

--
-- Name: Notations_id_seq; Type: SEQUENCE; Schema: exercises_library; Owner: postgres
--

CREATE SEQUENCE exercises_library."Notations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE exercises_library."Notations_id_seq" OWNER TO postgres;

--
-- Name: Notations_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Notations_id_seq" OWNED BY exercises_library."Notations".id;


--
-- Name: Tag_Categories; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Tag_Categories" (
    id integer NOT NULL,
    kind character varying(255) NOT NULL
);


ALTER TABLE exercises_library."Tag_Categories" OWNER TO postgres;

--
-- Name: Tag_Categories_id_seq; Type: SEQUENCE; Schema: exercises_library; Owner: postgres
--

CREATE SEQUENCE exercises_library."Tag_Categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE exercises_library."Tag_Categories_id_seq" OWNER TO postgres;

--
-- Name: Tag_Categories_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Tag_Categories_id_seq" OWNED BY exercises_library."Tag_Categories".id;


--
-- Name: Tags; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Tags" (
    id integer NOT NULL,
    text character varying(255) NOT NULL,
    "isValidated" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE exercises_library."Tags" OWNER TO postgres;

--
-- Name: Tags_id_seq; Type: SEQUENCE; Schema: exercises_library; Owner: postgres
--

CREATE SEQUENCE exercises_library."Tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE exercises_library."Tags_id_seq" OWNER TO postgres;

--
-- Name: Tags_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Tags_id_seq" OWNED BY exercises_library."Tags".id;


--
-- Name: Users; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Users" (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    "fullName" character varying(255) NOT NULL,
    role exercises_library."enum_Users_role" NOT NULL
);


ALTER TABLE exercises_library."Users" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: exercises_library; Owner: postgres
--

CREATE SEQUENCE exercises_library."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE exercises_library."Users_id_seq" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Users_id_seq" OWNED BY exercises_library."Users".id;


--
-- Name: Configurations id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Configurations_id_seq"'::regclass);


--
-- Name: Exercises id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Exercises_id_seq"'::regclass);


--
-- Name: Exercises_Metrics id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Metrics" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Exercises_Metrics_id_seq"'::regclass);


--
-- Name: Notations id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Notations_id_seq"'::regclass);


--
-- Name: Tag_Categories id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tag_Categories" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Tag_Categories_id_seq"'::regclass);


--
-- Name: Tags id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tags" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Tags_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Users" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Users_id_seq"'::regclass);


--
-- Name: Configurations_Tags Configurations_Tags_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations_Tags"
    ADD CONSTRAINT "Configurations_Tags_pkey" PRIMARY KEY (configuration_id, tag_id);


--
-- Name: Configurations Configurations_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations"
    ADD CONSTRAINT "Configurations_pkey" PRIMARY KEY (id);


--
-- Name: Exercises_Metrics Exercises_Metrics_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Metrics"
    ADD CONSTRAINT "Exercises_Metrics_pkey" PRIMARY KEY (id);


--
-- Name: Exercises_Tags Exercises_Tags_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Tags"
    ADD CONSTRAINT "Exercises_Tags_pkey" PRIMARY KEY (exercise_id, tag_id);


--
-- Name: Exercises Exercises_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises"
    ADD CONSTRAINT "Exercises_pkey" PRIMARY KEY (id);


--
-- Name: Notations Notations_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations"
    ADD CONSTRAINT "Notations_pkey" PRIMARY KEY (id);


--
-- Name: Tag_Categories Tag_Categories_kind_key; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tag_Categories"
    ADD CONSTRAINT "Tag_Categories_kind_key" UNIQUE (kind);


--
-- Name: Tag_Categories Tag_Categories_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tag_Categories"
    ADD CONSTRAINT "Tag_Categories_pkey" PRIMARY KEY (id);


--
-- Name: Tags Tags_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tags"
    ADD CONSTRAINT "Tags_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Configurations_Tags Configurations_Tags_configuration_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations_Tags"
    ADD CONSTRAINT "Configurations_Tags_configuration_id_fkey" FOREIGN KEY (configuration_id) REFERENCES exercises_library."Configurations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Configurations_Tags Configurations_Tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations_Tags"
    ADD CONSTRAINT "Configurations_Tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES exercises_library."Tags"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Configurations Configurations_user_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations"
    ADD CONSTRAINT "Configurations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES exercises_library."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Exercises_Metrics Exercises_Metrics_exercise_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Metrics"
    ADD CONSTRAINT "Exercises_Metrics_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises_library."Exercises"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Exercises_Tags Exercises_Tags_exercise_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Tags"
    ADD CONSTRAINT "Exercises_Tags_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises_library."Exercises"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Exercises_Tags Exercises_Tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Tags"
    ADD CONSTRAINT "Exercises_Tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES exercises_library."Tags"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Exercises Exercises_user_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises"
    ADD CONSTRAINT "Exercises_user_id_fkey" FOREIGN KEY (user_id) REFERENCES exercises_library."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notations Notations_exercise_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations"
    ADD CONSTRAINT "Notations_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises_library."Exercises"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notations Notations_user_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations"
    ADD CONSTRAINT "Notations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES exercises_library."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tags Tags_category_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tags"
    ADD CONSTRAINT "Tags_category_id_fkey" FOREIGN KEY (category_id) REFERENCES exercises_library."Tag_Categories"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

