'use strict';
// to construct the string for table
const WithSchema = (schema, table) => (schema) ? `"${schema}"."${table}"` : `"${table}"`;

module.exports = {
    up: (queryInterface, Sequelize) => {
        // if using a schema
        let schema;
        if (queryInterface.sequelize.options.schema) {
            schema = queryInterface.sequelize.options.schema;
        }
        let query = `
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

            -- This line is not accepted on travis
            SET default_table_access_method = heap;
            
            CREATE TYPE ${WithSchema(schema, "enum_Users_role")} AS ENUM (
                'admin',
                'user'
            );

            CREATE TABLE ${WithSchema(schema, "Configurations")} (
                id integer NOT NULL,
                name character varying(255) NOT NULL,
                user_id integer NOT NULL
            );
            
            CREATE TABLE ${WithSchema(schema, "Configurations_Tags")} (
                configuration_id integer NOT NULL,
                tag_id integer NOT NULL
            );

            CREATE SEQUENCE ${WithSchema(schema, "Configurations_id_seq")}
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE ${WithSchema(schema, "Configurations_id_seq")} OWNED BY ${WithSchema(schema, "Configurations")}.id;
            
            CREATE TABLE ${WithSchema(schema, "Exercises")} (
                id integer NOT NULL,
                title character varying(255) NOT NULL,
                description text DEFAULT ''::text,
                "createdAt" timestamp with time zone NOT NULL,
                "updatedAt" timestamp with time zone NOT NULL,
                version integer DEFAULT 0 NOT NULL,
                user_id integer NOT NULL
            );
            
            CREATE TABLE ${WithSchema(schema, "Exercises_Metrics")} (
                id integer NOT NULL,
                vote_count integer DEFAULT 0 NOT NULL,
                avg_vote_score numeric(3,2) DEFAULT 0 NOT NULL,
                tags_ids integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
                exercise_id integer NOT NULL
            );
            
            CREATE SEQUENCE ${WithSchema(schema, "Exercises_Metrics_id_seq")}
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
             
            ALTER SEQUENCE ${WithSchema(schema, "Exercises_Metrics_id_seq")} OWNED BY ${WithSchema(schema, "Exercises_Metrics")}.id;

            CREATE TABLE ${WithSchema(schema, "Exercises_Tags")} (
                exercise_id integer NOT NULL,
                tag_id integer NOT NULL
            );

            CREATE SEQUENCE ${WithSchema(schema, "Exercises_id_seq")}
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE ${WithSchema(schema, "Exercises_id_seq")} OWNED BY ${WithSchema(schema, "Exercises")}.id;
            
            CREATE TABLE ${WithSchema(schema, "Notations")} (
                id integer NOT NULL,
                note numeric(3,2) NOT NULL,
                exercise_id integer NOT NULL,
                user_id integer NOT NULL
            );
            
            CREATE SEQUENCE ${WithSchema(schema, "Notations_id_seq")}
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;

            ALTER SEQUENCE ${WithSchema(schema, "Notations_id_seq")} OWNED BY ${WithSchema(schema, "Notations")}.id;
            
            CREATE TABLE ${WithSchema(schema, "Tag_Categories")} (
                id integer NOT NULL,
                kind character varying(255) NOT NULL
            );
            
            CREATE SEQUENCE ${WithSchema(schema, "Tag_Categories_id_seq")}
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
                
            ALTER SEQUENCE ${WithSchema(schema, "Tag_Categories_id_seq")} OWNED BY ${WithSchema(schema, "Tag_Categories")}.id;
            
            CREATE TABLE ${WithSchema(schema, "Tags")} (
                id integer NOT NULL,
                text character varying(255) NOT NULL,
                "isValidated" boolean DEFAULT false NOT NULL,
                "createdAt" timestamp with time zone NOT NULL,
                "updatedAt" timestamp with time zone NOT NULL,
                version integer DEFAULT 0 NOT NULL,
                category_id integer NOT NULL
            );
            
            CREATE SEQUENCE ${WithSchema(schema, "Tags_id_seq")}
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
                
            ALTER SEQUENCE ${WithSchema(schema, "Tags_id_seq")} OWNED BY ${WithSchema(schema, "Tags")}.id;
            
            CREATE TABLE ${WithSchema(schema, "Users")} (
                id integer NOT NULL,
                email character varying(255) NOT NULL,
                password character varying(255) NOT NULL,
                "fullName" character varying(255) NOT NULL,
                role exercises_library."enum_Users_role" NOT NULL
            );
            
            CREATE SEQUENCE ${WithSchema(schema, "Users_id_seq")}
                AS integer
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1;
                
            ALTER SEQUENCE ${WithSchema(schema, "Users_id_seq")} OWNED BY ${WithSchema(schema, "Users")}.id;
            
            ALTER TABLE ONLY ${WithSchema(schema, "Configurations")} 
            ALTER COLUMN id 
            SET DEFAULT nextval('${WithSchema(schema, "Configurations_id_seq")}'::regclass);

            ALTER TABLE ONLY ${WithSchema(schema, "Exercises")} 
            ALTER COLUMN id 
            SET DEFAULT nextval('${WithSchema(schema, "Exercises_id_seq")}'::regclass);
            
            ALTER TABLE ONLY ${WithSchema(schema, "Exercises_Metrics")} 
            ALTER COLUMN id 
            SET DEFAULT nextval('${WithSchema(schema, "Exercises_Metrics_id_seq")}'::regclass);
            
            ALTER TABLE ONLY ${WithSchema(schema, "Notations")} 
            ALTER COLUMN id 
            SET DEFAULT nextval('${WithSchema(schema, "Notations_id_seq")}'::regclass);
            
            ALTER TABLE ONLY ${WithSchema(schema, "Tag_Categories")} 
            ALTER COLUMN id 
            SET DEFAULT nextval('${WithSchema(schema, "Tag_Categories_id_seq")}'::regclass);
            
            ALTER TABLE ONLY ${WithSchema(schema, "Tags")} 
            ALTER COLUMN id 
            SET DEFAULT nextval('${WithSchema(schema, "Tags_id_seq")}'::regclass);
            
            ALTER TABLE ONLY ${WithSchema(schema, "Users")} 
            ALTER COLUMN id 
            SET DEFAULT nextval('${WithSchema(schema, "Users_id_seq")}'::regclass);
            
            ALTER TABLE ONLY ${WithSchema(schema, "Configurations_Tags")}
                ADD CONSTRAINT "Configurations_Tags_pkey" PRIMARY KEY (configuration_id, tag_id);
                
            ALTER TABLE ONLY ${WithSchema(schema, "Configurations")}
                ADD CONSTRAINT "Configurations_pkey" PRIMARY KEY (id);

            ALTER TABLE ONLY ${WithSchema(schema, "Exercises_Metrics")}
                ADD CONSTRAINT "Exercises_Metrics_pkey" PRIMARY KEY (id);

            ALTER TABLE ONLY ${WithSchema(schema, "Exercises_Tags")}
                ADD CONSTRAINT "Exercises_Tags_pkey" PRIMARY KEY (exercise_id, tag_id); 
                
            ALTER TABLE ONLY ${WithSchema(schema, "Exercises")}
                ADD CONSTRAINT "Exercises_pkey" PRIMARY KEY (id);

            ALTER TABLE ONLY ${WithSchema(schema, "Notations")}
                ADD CONSTRAINT "Notations_pkey" PRIMARY KEY (id);

            ALTER TABLE ONLY ${WithSchema(schema, "Tag_Categories")}
                ADD CONSTRAINT "Tag_Categories_kind_key" UNIQUE (kind);

            ALTER TABLE ONLY ${WithSchema(schema, "Tag_Categories")}
                ADD CONSTRAINT "Tag_Categories_pkey" PRIMARY KEY (id);    

            ALTER TABLE ONLY ${WithSchema(schema, "Tags")}
                ADD CONSTRAINT "Tags_pkey" PRIMARY KEY (id);    

            ALTER TABLE ONLY ${WithSchema(schema, "Users")}
                ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);    

            ALTER TABLE ONLY ${WithSchema(schema, "Users")}
                ADD CONSTRAINT "Users_email_key" UNIQUE (email);  

            ALTER TABLE ONLY ${WithSchema(schema, "Configurations_Tags")}
                ADD CONSTRAINT "Configurations_Tags_configuration_id_fkey" 
                FOREIGN KEY (configuration_id) 
                REFERENCES ${WithSchema(schema, "Configurations")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;

            ALTER TABLE ONLY ${WithSchema(schema, "Configurations_Tags")}
                ADD CONSTRAINT "Configurations_Tags_tag_id_fkey" 
                FOREIGN KEY (tag_id) 
                REFERENCES ${WithSchema(schema, "Tags")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
                
            ALTER TABLE ONLY ${WithSchema(schema, "Configurations")}
                ADD CONSTRAINT "Configurations_user_id_fkey" 
                FOREIGN KEY (user_id) 
                REFERENCES ${WithSchema(schema, "Users")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;

            ALTER TABLE ONLY ${WithSchema(schema, "Exercises_Metrics")}
                ADD CONSTRAINT "Exercises_Metrics_exercise_id_fkey" 
                FOREIGN KEY (exercise_id) 
                REFERENCES ${WithSchema(schema, "Exercises")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
                
            ALTER TABLE ONLY ${WithSchema(schema, "Exercises_Tags")}
                ADD CONSTRAINT "Exercises_Tags_exercise_id_fkey" 
                FOREIGN KEY (exercise_id) 
                REFERENCES ${WithSchema(schema, "Exercises")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
                
            ALTER TABLE ONLY ${WithSchema(schema, "Exercises_Tags")}
                ADD CONSTRAINT "Exercises_Tags_tag_id_fkey" 
                FOREIGN KEY (tag_id) 
                REFERENCES ${WithSchema(schema, "Tags")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
                
            ALTER TABLE ONLY ${WithSchema(schema, "Exercises")}
                ADD CONSTRAINT "Exercises_user_id_fkey" 
                FOREIGN KEY (user_id) 
                REFERENCES ${WithSchema(schema, "Users")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
                
            ALTER TABLE ONLY ${WithSchema(schema, "Notations")}
                ADD CONSTRAINT "Notations_exercise_id_fkey" 
                FOREIGN KEY (exercise_id) 
                REFERENCES ${WithSchema(schema, "Exercises")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
                
            ALTER TABLE ONLY ${WithSchema(schema, "Notations")}
                ADD CONSTRAINT "Notations_user_id_fkey" 
                FOREIGN KEY (user_id) 
                REFERENCES ${WithSchema(schema, "Users")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
                
            ALTER TABLE ONLY ${WithSchema(schema, "Tags")}
                ADD CONSTRAINT "Tags_category_id_fkey" 
                FOREIGN KEY (category_id) 
                REFERENCES ${WithSchema(schema, "Tag_Categories")}(id) 
                ON UPDATE CASCADE ON DELETE CASCADE;
        `;
        return queryInterface.sequelize.query(query);
    },

    down: (queryInterface, Sequelize) => {
        // delete all tables since it is the first migrations
        return queryInterface.dropAllTables();
    }
};
