--
-- PostgreSQL database dump
--

-- Dumped from database version 12.0
-- Dumped by pg_dump version 12.0

-- Started on 2019-11-20 17:40:13

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
-- TOC entry 6 (class 2615 OID 23274)
-- Name: exercises_library; Type: SCHEMA; Schema: -; Owner: postgres
--

-- DONT TOUCH THIS AS I NEED THAT
-- I use a schema for easily delete / regenerate these table
DROP SCHEMA IF EXISTS exercises_library CASCADE;
CREATE SCHEMA exercises_library;

ALTER SCHEMA exercises_library OWNER TO postgres;

--
-- TOC entry 552 (class 1247 OID 23276)
-- Name: enum_Users_role; Type: TYPE; Schema: exercises_library; Owner: postgres
--

CREATE TYPE exercises_library."enum_Users_role" AS ENUM (
    'admin',
    'user'
);


ALTER TYPE exercises_library."enum_Users_role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 206 (class 1259 OID 23296)
-- Name: Configurations; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Configurations" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE exercises_library."Configurations" OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 23332)
-- Name: Configurations_Tags; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Configurations_Tags" (
    configuration_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE exercises_library."Configurations_Tags" OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 23294)
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
-- TOC entry 2915 (class 0 OID 0)
-- Dependencies: 205
-- Name: Configurations_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Configurations_id_seq" OWNED BY exercises_library."Configurations".id;


--
-- TOC entry 213 (class 1259 OID 23349)
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
-- TOC entry 215 (class 1259 OID 23367)
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
-- TOC entry 214 (class 1259 OID 23365)
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
-- TOC entry 2916 (class 0 OID 0)
-- Dependencies: 214
-- Name: Exercises_Metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Exercises_Metrics_id_seq" OWNED BY exercises_library."Exercises_Metrics".id;


--
-- TOC entry 216 (class 1259 OID 23384)
-- Name: Exercises_Tags; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Exercises_Tags" (
    exercise_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE exercises_library."Exercises_Tags" OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 23347)
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
-- TOC entry 2917 (class 0 OID 0)
-- Dependencies: 212
-- Name: Exercises_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Exercises_id_seq" OWNED BY exercises_library."Exercises".id;


--
-- TOC entry 218 (class 1259 OID 23401)
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
-- TOC entry 217 (class 1259 OID 23399)
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
-- TOC entry 2918 (class 0 OID 0)
-- Dependencies: 217
-- Name: Notations_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Notations_id_seq" OWNED BY exercises_library."Notations".id;


--
-- TOC entry 208 (class 1259 OID 23309)
-- Name: Tag_Categories; Type: TABLE; Schema: exercises_library; Owner: postgres
--

CREATE TABLE exercises_library."Tag_Categories" (
    id integer NOT NULL,
    kind character varying(255) NOT NULL
);


ALTER TABLE exercises_library."Tag_Categories" OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 23307)
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
-- TOC entry 2919 (class 0 OID 0)
-- Dependencies: 207
-- Name: Tag_Categories_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Tag_Categories_id_seq" OWNED BY exercises_library."Tag_Categories".id;


--
-- TOC entry 210 (class 1259 OID 23319)
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
-- TOC entry 209 (class 1259 OID 23317)
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
-- TOC entry 2920 (class 0 OID 0)
-- Dependencies: 209
-- Name: Tags_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Tags_id_seq" OWNED BY exercises_library."Tags".id;


--
-- TOC entry 204 (class 1259 OID 23283)
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
-- TOC entry 203 (class 1259 OID 23281)
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
-- TOC entry 2921 (class 0 OID 0)
-- Dependencies: 203
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: exercises_library; Owner: postgres
--

ALTER SEQUENCE exercises_library."Users_id_seq" OWNED BY exercises_library."Users".id;


--
-- TOC entry 2739 (class 2604 OID 23299)
-- Name: Configurations id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Configurations_id_seq"'::regclass);


--
-- TOC entry 2744 (class 2604 OID 23352)
-- Name: Exercises id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Exercises_id_seq"'::regclass);


--
-- TOC entry 2747 (class 2604 OID 23370)
-- Name: Exercises_Metrics id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Metrics" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Exercises_Metrics_id_seq"'::regclass);


--
-- TOC entry 2751 (class 2604 OID 23404)
-- Name: Notations id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Notations_id_seq"'::regclass);


--
-- TOC entry 2740 (class 2604 OID 23312)
-- Name: Tag_Categories id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tag_Categories" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Tag_Categories_id_seq"'::regclass);


--
-- TOC entry 2741 (class 2604 OID 23322)
-- Name: Tags id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tags" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Tags_id_seq"'::regclass);


--
-- TOC entry 2738 (class 2604 OID 23286)
-- Name: Users id; Type: DEFAULT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Users" ALTER COLUMN id SET DEFAULT nextval('exercises_library."Users_id_seq"'::regclass);


--
-- TOC entry 2765 (class 2606 OID 23336)
-- Name: Configurations_Tags Configurations_Tags_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations_Tags"
    ADD CONSTRAINT "Configurations_Tags_pkey" PRIMARY KEY (configuration_id, tag_id);


--
-- TOC entry 2757 (class 2606 OID 23301)
-- Name: Configurations Configurations_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations"
    ADD CONSTRAINT "Configurations_pkey" PRIMARY KEY (id);


--
-- TOC entry 2769 (class 2606 OID 23378)
-- Name: Exercises_Metrics Exercises_Metrics_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Metrics"
    ADD CONSTRAINT "Exercises_Metrics_pkey" PRIMARY KEY (id);


--
-- TOC entry 2771 (class 2606 OID 23388)
-- Name: Exercises_Tags Exercises_Tags_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Tags"
    ADD CONSTRAINT "Exercises_Tags_pkey" PRIMARY KEY (exercise_id, tag_id);


--
-- TOC entry 2767 (class 2606 OID 23359)
-- Name: Exercises Exercises_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises"
    ADD CONSTRAINT "Exercises_pkey" PRIMARY KEY (id);


--
-- TOC entry 2773 (class 2606 OID 23406)
-- Name: Notations Notations_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations"
    ADD CONSTRAINT "Notations_pkey" PRIMARY KEY (id);


--
-- TOC entry 2759 (class 2606 OID 23316)
-- Name: Tag_Categories Tag_Categories_kind_key; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tag_Categories"
    ADD CONSTRAINT "Tag_Categories_kind_key" UNIQUE (kind);


--
-- TOC entry 2761 (class 2606 OID 23314)
-- Name: Tag_Categories Tag_Categories_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tag_Categories"
    ADD CONSTRAINT "Tag_Categories_pkey" PRIMARY KEY (id);


--
-- TOC entry 2763 (class 2606 OID 23326)
-- Name: Tags Tags_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tags"
    ADD CONSTRAINT "Tags_pkey" PRIMARY KEY (id);


--
-- TOC entry 2753 (class 2606 OID 23293)
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 2755 (class 2606 OID 23291)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 2776 (class 2606 OID 23337)
-- Name: Configurations_Tags Configurations_Tags_configuration_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations_Tags"
    ADD CONSTRAINT "Configurations_Tags_configuration_id_fkey" FOREIGN KEY (configuration_id) REFERENCES exercises_library."Configurations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2777 (class 2606 OID 23342)
-- Name: Configurations_Tags Configurations_Tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations_Tags"
    ADD CONSTRAINT "Configurations_Tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES exercises_library."Tags"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2774 (class 2606 OID 23302)
-- Name: Configurations Configurations_user_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Configurations"
    ADD CONSTRAINT "Configurations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES exercises_library."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2779 (class 2606 OID 23379)
-- Name: Exercises_Metrics Exercises_Metrics_exercise_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Metrics"
    ADD CONSTRAINT "Exercises_Metrics_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises_library."Exercises"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2780 (class 2606 OID 23389)
-- Name: Exercises_Tags Exercises_Tags_exercise_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Tags"
    ADD CONSTRAINT "Exercises_Tags_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises_library."Exercises"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2781 (class 2606 OID 23394)
-- Name: Exercises_Tags Exercises_Tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises_Tags"
    ADD CONSTRAINT "Exercises_Tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES exercises_library."Tags"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2778 (class 2606 OID 23360)
-- Name: Exercises Exercises_user_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Exercises"
    ADD CONSTRAINT "Exercises_user_id_fkey" FOREIGN KEY (user_id) REFERENCES exercises_library."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2782 (class 2606 OID 23407)
-- Name: Notations Notations_exercise_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations"
    ADD CONSTRAINT "Notations_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES exercises_library."Exercises"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2783 (class 2606 OID 23412)
-- Name: Notations Notations_user_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Notations"
    ADD CONSTRAINT "Notations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES exercises_library."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 2775 (class 2606 OID 23327)
-- Name: Tags Tags_category_id_fkey; Type: FK CONSTRAINT; Schema: exercises_library; Owner: postgres
--

ALTER TABLE ONLY exercises_library."Tags"
    ADD CONSTRAINT "Tags_category_id_fkey" FOREIGN KEY (category_id) REFERENCES exercises_library."Tag_Categories"(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2019-11-20 17:40:13

--
-- PostgreSQL database dump complete
--

