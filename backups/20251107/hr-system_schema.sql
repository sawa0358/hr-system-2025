--
-- PostgreSQL database dump
--

\restrict pePfCfgw1Xa0ZPpO0H4AIfGN8uDmUPpyKSyFEpfXOAv7BThRPRaUQMHJUc7ZSIz

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6 (Homebrew)

-- Started on 2025-11-08 01:47:00 JST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 1632120234)
-- Name: _heroku; Type: SCHEMA; Schema: -; Owner: heroku_admin
--

CREATE SCHEMA _heroku;


ALTER SCHEMA _heroku OWNER TO heroku_admin;

--
-- TOC entry 7 (class 2615 OID 2379209296)
-- Name: public; Type: SCHEMA; Schema: -; Owner: u2t9d5jj58kd56
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 4676 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: u2t9d5jj58kd56
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 2379209297)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- TOC entry 4678 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 954 (class 1247 OID 2379209450)
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'active',
    'leave',
    'retired',
    'suspended',
    'copy'
);


ALTER TYPE public."EmployeeStatus" OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 893 (class 1247 OID 2379250843)
-- Name: EmploymentType; Type: TYPE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TYPE public."EmploymentType" AS ENUM (
    'FULL_TIME',
    'PART_TIME'
);


ALTER TYPE public."EmploymentType" OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 899 (class 1247 OID 2379250854)
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public."RequestStatus" OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 896 (class 1247 OID 2379250848)
-- Name: RequestUnit; Type: TYPE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TYPE public."RequestUnit" AS ENUM (
    'DAY',
    'HOUR'
);


ALTER TYPE public."RequestUnit" OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 951 (class 1247 OID 2379209434)
-- Name: UserRole; Type: TYPE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TYPE public."UserRole" AS ENUM (
    'viewer',
    'general',
    'sub_manager',
    'store_manager',
    'manager',
    'hr',
    'admin'
);


ALTER TYPE public."UserRole" OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 272 (class 1255 OID 1632120235)
-- Name: create_ext(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.create_ext() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  schemaname TEXT;
  databaseowner TEXT;

  r RECORD;

BEGIN

  IF tg_tag = 'CREATE EXTENSION' and current_user != 'rds_superuser' THEN
    FOR r IN SELECT * FROM pg_catalog.pg_event_trigger_ddl_commands()
    LOOP
        CONTINUE WHEN r.command_tag != 'CREATE EXTENSION' OR r.object_type != 'extension';

        schemaname = (
            SELECT n.nspname
            FROM pg_catalog.pg_extension AS e
            INNER JOIN pg_catalog.pg_namespace AS n
            ON e.extnamespace = n.oid
            WHERE e.oid = r.objid
        );

        databaseowner = (
            SELECT pg_catalog.pg_get_userbyid(d.datdba)
            FROM pg_catalog.pg_database d
            WHERE d.datname = pg_catalog.current_database()
        );
        --RAISE NOTICE 'Record for event trigger %, objid: %,tag: %, current_user: %, schema: %, database_owenr: %', r.object_identity, r.objid, tg_tag, current_user, schemaname, databaseowner;
        IF r.object_identity = 'address_standardizer_data_us' THEN
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_gaz');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_lex');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_rules');
        ELSIF r.object_identity = 'amcheck' THEN
            EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION %I.bt_index_check TO %I;', schemaname, databaseowner);
            EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION %I.bt_index_parent_check TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'dict_int' THEN
            EXECUTE pg_catalog.format('ALTER TEXT SEARCH DICTIONARY %I.intdict OWNER TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'pg_partman' THEN
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'part_config');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'part_config_sub');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'custom_time_partitions');
        ELSIF r.object_identity = 'pg_stat_statements' THEN
            EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION %I.pg_stat_statements_reset TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'postgis' THEN
            PERFORM _heroku.postgis_after_create();
        ELSIF r.object_identity = 'postgis_raster' THEN
            PERFORM _heroku.postgis_after_create();
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT', databaseowner, 'raster_columns');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT', databaseowner, 'raster_overviews');
        ELSIF r.object_identity = 'postgis_topology' THEN
            PERFORM _heroku.postgis_after_create();
            EXECUTE pg_catalog.format('GRANT USAGE ON SCHEMA topology TO %I;', databaseowner);
            EXECUTE pg_catalog.format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA topology TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('topology', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);
            EXECUTE pg_catalog.format('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA topology TO %I;', databaseowner);
        ELSIF r.object_identity = 'postgis_tiger_geocoder' THEN
            PERFORM _heroku.postgis_after_create();
            EXECUTE pg_catalog.format('GRANT USAGE ON SCHEMA tiger TO %I;', databaseowner);
            EXECUTE pg_catalog.format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tiger TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('tiger', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);

            EXECUTE pg_catalog.format('GRANT USAGE ON SCHEMA tiger_data TO %I;', databaseowner);
            EXECUTE pg_catalog.format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tiger_data TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('tiger_data', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);
        END IF;
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.create_ext() OWNER TO heroku_admin;

--
-- TOC entry 273 (class 1255 OID 1632120236)
-- Name: drop_ext(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.drop_ext() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  schemaname TEXT;
  databaseowner TEXT;

  r RECORD;

BEGIN

  IF tg_tag = 'DROP EXTENSION' and current_user != 'rds_superuser' THEN
    FOR r IN SELECT * FROM pg_catalog.pg_event_trigger_dropped_objects()
    LOOP
      CONTINUE WHEN r.object_type != 'extension';

      databaseowner = (
            SELECT pg_catalog.pg_get_userbyid(d.datdba)
            FROM pg_catalog.pg_database d
            WHERE d.datname = pg_catalog.current_database()
      );

      --RAISE NOTICE 'Record for event trigger %, objid: %,tag: %, current_user: %, database_owner: %, schemaname: %', r.object_identity, r.objid, tg_tag, current_user, databaseowner, r.schema_name;

      IF r.object_identity = 'postgis_topology' THEN
          EXECUTE pg_catalog.format('DROP SCHEMA IF EXISTS topology');
      END IF;
    END LOOP;

  END IF;
END;
$$;


ALTER FUNCTION _heroku.drop_ext() OWNER TO heroku_admin;

--
-- TOC entry 274 (class 1255 OID 1632120237)
-- Name: extension_before_drop(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.extension_before_drop() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  query TEXT;

BEGIN
  query = (SELECT pg_catalog.current_query());

  -- RAISE NOTICE 'executing extension_before_drop: tg_event: %, tg_tag: %, current_user: %, session_user: %, query: %', tg_event, tg_tag, current_user, session_user, query;
  IF tg_tag = 'DROP EXTENSION' and not pg_catalog.pg_has_role(session_user, 'rds_superuser', 'MEMBER') THEN
    -- DROP EXTENSION [ IF EXISTS ] name [, ...] [ CASCADE | RESTRICT ]
    IF (pg_catalog.regexp_match(query, 'DROP\s+EXTENSION\s+(IF\s+EXISTS)?.*(plpgsql)', 'i') IS NOT NULL) THEN
      RAISE EXCEPTION 'The plpgsql extension is required for database management and cannot be dropped.';
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.extension_before_drop() OWNER TO heroku_admin;

--
-- TOC entry 271 (class 1255 OID 1632120238)
-- Name: grant_table_if_exists(text, text, text, text); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.grant_table_if_exists(alias_schemaname text, grants text, databaseowner text, alias_tablename text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  IF alias_tablename IS NULL THEN
    EXECUTE pg_catalog.format('GRANT %s ON ALL TABLES IN SCHEMA %I TO %I;', grants, alias_schemaname, databaseowner);
  ELSE
    IF EXISTS (SELECT 1 FROM pg_tables WHERE pg_tables.schemaname = alias_schemaname AND pg_tables.tablename = alias_tablename) THEN
      EXECUTE pg_catalog.format('GRANT %s ON TABLE %I.%I TO %I;', grants, alias_schemaname, alias_tablename, databaseowner);
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.grant_table_if_exists(alias_schemaname text, grants text, databaseowner text, alias_tablename text) OWNER TO heroku_admin;

--
-- TOC entry 275 (class 1255 OID 1632120239)
-- Name: postgis_after_create(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.postgis_after_create() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    schemaname TEXT;
    databaseowner TEXT;
BEGIN
    schemaname = (
        SELECT n.nspname
        FROM pg_catalog.pg_extension AS e
        INNER JOIN pg_catalog.pg_namespace AS n ON e.extnamespace = n.oid
        WHERE e.extname = 'postgis'
    );
    databaseowner = (
        SELECT pg_catalog.pg_get_userbyid(d.datdba)
        FROM pg_catalog.pg_database d
        WHERE d.datname = pg_catalog.current_database()
    );

    EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION %I.st_tileenvelope TO %I;', schemaname, databaseowner);
    EXECUTE pg_catalog.format('GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE %I.spatial_ref_sys TO %I;', schemaname, databaseowner);
END;
$$;


ALTER FUNCTION _heroku.postgis_after_create() OWNER TO heroku_admin;

--
-- TOC entry 267 (class 1255 OID 1632120241)
-- Name: validate_extension(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.validate_extension() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  schemaname TEXT;
  r RECORD;

BEGIN

  IF tg_tag = 'CREATE EXTENSION' and current_user != 'rds_superuser' THEN
    FOR r IN SELECT * FROM pg_catalog.pg_event_trigger_ddl_commands()
    LOOP
      CONTINUE WHEN r.command_tag != 'CREATE EXTENSION' OR r.object_type != 'extension';

      schemaname = (
        SELECT n.nspname
        FROM pg_catalog.pg_extension AS e
        INNER JOIN pg_catalog.pg_namespace AS n
        ON e.extnamespace = n.oid
        WHERE e.oid = r.objid
      );

      IF schemaname = '_heroku' THEN
        RAISE EXCEPTION 'Creating extensions in the _heroku schema is not allowed';
      END IF;
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.validate_extension() OWNER TO heroku_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 254 (class 1259 OID 2389364155)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 229 (class 1259 OID 2379209545)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.activity_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "userName" text NOT NULL,
    action text NOT NULL,
    module text NOT NULL,
    details text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 251 (class 1259 OID 2379250952)
-- Name: alert_events; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.alert_events (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    kind text NOT NULL,
    "referenceDate" timestamp(3) without time zone NOT NULL,
    details text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.alert_events OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 247 (class 1259 OID 2379250913)
-- Name: alert_settings; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.alert_settings (
    id text NOT NULL,
    "alert3MonthsBefore" boolean DEFAULT true NOT NULL,
    "alert3MonthsThreshold" integer DEFAULT 5 NOT NULL,
    "alert2MonthsBefore" boolean DEFAULT true NOT NULL,
    "alert2MonthsThreshold" integer DEFAULT 3 NOT NULL,
    "alert1MonthBefore" boolean DEFAULT true NOT NULL,
    "alert1MonthThreshold" integer DEFAULT 5 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.alert_settings OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 225 (class 1259 OID 2379209511)
-- Name: attendance; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.attendance (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "clockIn" timestamp(3) without time zone,
    "clockOut" timestamp(3) without time zone,
    "breakStart" timestamp(3) without time zone,
    "breakEnd" timestamp(3) without time zone,
    status text DEFAULT 'present'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.attendance OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 252 (class 1259 OID 2379250960)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "employeeId" text,
    actor text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    payload text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 234 (class 1259 OID 2379209588)
-- Name: board_lists; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.board_lists (
    id text NOT NULL,
    title text NOT NULL,
    "position" integer NOT NULL,
    "boardId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.board_lists OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 233 (class 1259 OID 2379209579)
-- Name: boards; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.boards (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "workspaceId" text NOT NULL,
    "createdBy" text,
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.boards OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 236 (class 1259 OID 2379209607)
-- Name: card_members; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.card_members (
    id text NOT NULL,
    "cardId" text NOT NULL,
    "employeeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.card_members OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 235 (class 1259 OID 2379209596)
-- Name: cards; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.cards (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "position" integer NOT NULL,
    "listId" text NOT NULL,
    "boardId" text NOT NULL,
    "createdBy" text,
    attachments jsonb,
    labels jsonb,
    checklists jsonb,
    "dueDate" timestamp(3) without time zone,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'todo'::text NOT NULL,
    "cardColor" text,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cards OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 249 (class 1259 OID 2379250935)
-- Name: consumptions; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.consumptions (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "requestId" text NOT NULL,
    "lotId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "daysUsed" numeric(65,30) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.consumptions OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 238 (class 1259 OID 2379209623)
-- Name: custom_folders; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.custom_folders (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    category text DEFAULT 'employee'::text NOT NULL,
    name text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.custom_folders OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 221 (class 1259 OID 2379209461)
-- Name: employees; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.employees (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "employeeNumber" text NOT NULL,
    "employeeType" text NOT NULL,
    name text NOT NULL,
    furigana text,
    email text,
    phone text,
    department text NOT NULL,
    "position" text NOT NULL,
    organization text NOT NULL,
    team text,
    "joinDate" timestamp(3) without time zone NOT NULL,
    status public."EmployeeStatus" DEFAULT 'active'::public."EmployeeStatus" NOT NULL,
    password text NOT NULL,
    role public."UserRole",
    "myNumber" text,
    "userId" text,
    url text,
    address text,
    "selfIntroduction" text,
    "phoneInternal" text,
    "phoneMobile" text,
    "birthDate" timestamp(3) without time zone,
    avatar text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "showInOrgChart" boolean DEFAULT true NOT NULL,
    "parentEmployeeId" text,
    "isInvisibleTop" boolean DEFAULT false NOT NULL,
    "isSuspended" boolean DEFAULT false NOT NULL,
    "retirementDate" timestamp(3) without time zone,
    "privacyDisplayName" boolean DEFAULT true NOT NULL,
    "privacyOrganization" boolean DEFAULT true NOT NULL,
    "privacyDepartment" boolean DEFAULT true NOT NULL,
    "privacyPosition" boolean DEFAULT true NOT NULL,
    "privacyUrl" boolean DEFAULT true NOT NULL,
    "privacyAddress" boolean DEFAULT true NOT NULL,
    "privacyBio" boolean DEFAULT true NOT NULL,
    "privacyEmail" boolean DEFAULT true NOT NULL,
    "privacyWorkPhone" boolean DEFAULT true NOT NULL,
    "privacyExtension" boolean DEFAULT true NOT NULL,
    "privacyMobilePhone" boolean DEFAULT true NOT NULL,
    "privacyBirthDate" boolean DEFAULT false NOT NULL,
    "orgChartLabel" text,
    description text,
    "configVersion" text,
    "employmentType" public."EmploymentType",
    "vacationPattern" text,
    "weeklyPattern" integer
);


ALTER TABLE public.employees OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 222 (class 1259 OID 2379209485)
-- Name: evaluations; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.evaluations (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    period text NOT NULL,
    evaluator text NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.evaluations OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 237 (class 1259 OID 2379209615)
-- Name: family_members; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.family_members (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    name text NOT NULL,
    relationship text NOT NULL,
    "birthDate" timestamp(3) without time zone,
    phone text,
    address text,
    "myNumber" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.family_members OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 227 (class 1259 OID 2379209529)
-- Name: files; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.files (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "originalName" text NOT NULL,
    filename text NOT NULL,
    "filePath" text,
    "s3Key" text,
    "mimeType" text NOT NULL,
    "fileSize" integer NOT NULL,
    category text NOT NULL,
    "folderName" text,
    "taskId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.files OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 228 (class 1259 OID 2379209537)
-- Name: folders; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.folders (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    name text NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.folders OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 248 (class 1259 OID 2379250927)
-- Name: grant_lots; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.grant_lots (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "grantDate" timestamp(3) without time zone NOT NULL,
    "daysGranted" numeric(65,30) NOT NULL,
    "daysRemaining" numeric(65,30) NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "dedupKey" text NOT NULL,
    "configVersion" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.grant_lots OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 255 (class 1259 OID 2389382903)
-- Name: leave_history_snapshots; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.leave_history_snapshots (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "snapshotDate" timestamp(3) without time zone NOT NULL,
    "grantYear" integer NOT NULL,
    "grantDate" timestamp(3) without time zone NOT NULL,
    "totalGranted" numeric NOT NULL,
    used numeric NOT NULL,
    pending numeric NOT NULL,
    remaining numeric NOT NULL,
    "joinDate" timestamp(3) without time zone NOT NULL,
    "imageUrl" text,
    "pdfUrl" text,
    "fileFormat" text DEFAULT 'png'::text NOT NULL,
    "snapshotData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.leave_history_snapshots OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 230 (class 1259 OID 2379209553)
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.leave_requests (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    type text NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 240 (class 1259 OID 2379209641)
-- Name: master_data; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.master_data (
    id text NOT NULL,
    type text NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.master_data OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 243 (class 1259 OID 2379250879)
-- Name: parttime_grant_schedule; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.parttime_grant_schedule (
    id text NOT NULL,
    "serviceDays" integer NOT NULL,
    "workDaysPerWeek" integer NOT NULL,
    "grantDays" integer NOT NULL,
    "annualMinDays" integer NOT NULL,
    "annualMaxDays" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.parttime_grant_schedule OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 226 (class 1259 OID 2379209520)
-- Name: payroll; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.payroll (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    period text NOT NULL,
    amount double precision NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payroll OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 224 (class 1259 OID 2379209503)
-- Name: task_members; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.task_members (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "employeeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.task_members OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 223 (class 1259 OID 2379209493)
-- Name: tasks; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "employeeId" text NOT NULL
);


ALTER TABLE public.tasks OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 250 (class 1259 OID 2379250943)
-- Name: time_off_requests; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.time_off_requests (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    unit public."RequestUnit" NOT NULL,
    "hoursPerDay" integer,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "totalDays" numeric(65,30),
    "breakdownJson" text,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvedBy" text,
    "finalizedBy" text,
    "supervisorId" text
);


ALTER TABLE public.time_off_requests OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 239 (class 1259 OID 2379209633)
-- Name: user_settings; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.user_settings (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_settings OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 253 (class 1259 OID 2379250968)
-- Name: vacation_app_configs; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.vacation_app_configs (
    id text NOT NULL,
    version text NOT NULL,
    "configJson" text NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vacation_app_configs OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 244 (class 1259 OID 2379250887)
-- Name: vacation_balances; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.vacation_balances (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "grantDate" timestamp(3) without time zone NOT NULL,
    "grantDays" integer NOT NULL,
    "remainingDays" double precision NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "isExpired" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vacation_balances OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 242 (class 1259 OID 2379250871)
-- Name: vacation_grant_schedule; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.vacation_grant_schedule (
    id text NOT NULL,
    "serviceYears" double precision NOT NULL,
    "fullTimeGrantDays" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vacation_grant_schedule OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 245 (class 1259 OID 2379250896)
-- Name: vacation_requests; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.vacation_requests (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "usedDays" double precision NOT NULL,
    reason text,
    status public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vacation_requests OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 241 (class 1259 OID 2379250863)
-- Name: vacation_settings; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.vacation_settings (
    id text NOT NULL,
    "initialGrantPeriod" integer NOT NULL,
    "grantPeriod" integer NOT NULL,
    "carryOverLimit" integer NOT NULL,
    "validityYears" integer NOT NULL,
    "minimumMandatoryDays" integer NOT NULL,
    "fullTimeGrantDays" integer NOT NULL,
    "partTime1DayGrant" integer NOT NULL,
    "partTime2DayGrant" integer NOT NULL,
    "partTime3DayGrant" integer NOT NULL,
    "partTime4DayGrant" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vacation_settings OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 246 (class 1259 OID 2379250905)
-- Name: vacation_usage; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.vacation_usage (
    id text NOT NULL,
    "requestId" text NOT NULL,
    "balanceId" text NOT NULL,
    "usedDays" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vacation_usage OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 232 (class 1259 OID 2379209570)
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.workspace_members (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "employeeId" text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workspace_members OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 231 (class 1259 OID 2379209562)
-- Name: workspaces; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.workspaces (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.workspaces OWNER TO u2t9d5jj58kd56;

--
-- TOC entry 4482 (class 2606 OID 2389364163)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4414 (class 2606 OID 2379209552)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4473 (class 2606 OID 2379250959)
-- Name: alert_events alert_events_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.alert_events
    ADD CONSTRAINT alert_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4456 (class 2606 OID 2379250926)
-- Name: alert_settings alert_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.alert_settings
    ADD CONSTRAINT alert_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4406 (class 2606 OID 2379209519)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 4477 (class 2606 OID 2379250967)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4425 (class 2606 OID 2379209595)
-- Name: board_lists board_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.board_lists
    ADD CONSTRAINT board_lists_pkey PRIMARY KEY (id);


--
-- TOC entry 4423 (class 2606 OID 2379209587)
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- TOC entry 4430 (class 2606 OID 2379209614)
-- Name: card_members card_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.card_members
    ADD CONSTRAINT card_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4427 (class 2606 OID 2379209606)
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- TOC entry 4464 (class 2606 OID 2379250942)
-- Name: consumptions consumptions_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.consumptions
    ADD CONSTRAINT consumptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4434 (class 2606 OID 2379209632)
-- Name: custom_folders custom_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.custom_folders
    ADD CONSTRAINT custom_folders_pkey PRIMARY KEY (id);


--
-- TOC entry 4397 (class 2606 OID 2379209484)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 4399 (class 2606 OID 2379209492)
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 4432 (class 2606 OID 2379209622)
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4410 (class 2606 OID 2379209536)
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- TOC entry 4412 (class 2606 OID 2379209544)
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- TOC entry 4460 (class 2606 OID 2379250934)
-- Name: grant_lots grant_lots_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.grant_lots
    ADD CONSTRAINT grant_lots_pkey PRIMARY KEY (id);


--
-- TOC entry 4486 (class 2606 OID 2389382912)
-- Name: leave_history_snapshots leave_history_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.leave_history_snapshots
    ADD CONSTRAINT leave_history_snapshots_pkey PRIMARY KEY (id);


--
-- TOC entry 4416 (class 2606 OID 2379209561)
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4439 (class 2606 OID 2379209649)
-- Name: master_data master_data_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.master_data
    ADD CONSTRAINT master_data_pkey PRIMARY KEY (id);


--
-- TOC entry 4446 (class 2606 OID 2379250886)
-- Name: parttime_grant_schedule parttime_grant_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.parttime_grant_schedule
    ADD CONSTRAINT parttime_grant_schedule_pkey PRIMARY KEY (id);


--
-- TOC entry 4408 (class 2606 OID 2379209528)
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- TOC entry 4403 (class 2606 OID 2379209510)
-- Name: task_members task_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.task_members
    ADD CONSTRAINT task_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4401 (class 2606 OID 2379209502)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4468 (class 2606 OID 2379250951)
-- Name: time_off_requests time_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.time_off_requests
    ADD CONSTRAINT time_off_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4437 (class 2606 OID 2379209640)
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4479 (class 2606 OID 2379250976)
-- Name: vacation_app_configs vacation_app_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_app_configs
    ADD CONSTRAINT vacation_app_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 4450 (class 2606 OID 2379250895)
-- Name: vacation_balances vacation_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_balances
    ADD CONSTRAINT vacation_balances_pkey PRIMARY KEY (id);


--
-- TOC entry 4444 (class 2606 OID 2379250878)
-- Name: vacation_grant_schedule vacation_grant_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_grant_schedule
    ADD CONSTRAINT vacation_grant_schedule_pkey PRIMARY KEY (id);


--
-- TOC entry 4452 (class 2606 OID 2379250904)
-- Name: vacation_requests vacation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_requests
    ADD CONSTRAINT vacation_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4442 (class 2606 OID 2379250870)
-- Name: vacation_settings vacation_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_settings
    ADD CONSTRAINT vacation_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4454 (class 2606 OID 2379250912)
-- Name: vacation_usage vacation_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_usage
    ADD CONSTRAINT vacation_usage_pkey PRIMARY KEY (id);


--
-- TOC entry 4420 (class 2606 OID 2379209578)
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4418 (class 2606 OID 2379209569)
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- TOC entry 4470 (class 1259 OID 2379250985)
-- Name: alert_events_employeeId_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "alert_events_employeeId_idx" ON public.alert_events USING btree ("employeeId");


--
-- TOC entry 4471 (class 1259 OID 2379250986)
-- Name: alert_events_employeeId_kind_referenceDate_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "alert_events_employeeId_kind_referenceDate_key" ON public.alert_events USING btree ("employeeId", kind, "referenceDate");


--
-- TOC entry 4474 (class 1259 OID 2379250988)
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- TOC entry 4475 (class 1259 OID 2379250987)
-- Name: audit_logs_employeeId_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "audit_logs_employeeId_idx" ON public.audit_logs USING btree ("employeeId");


--
-- TOC entry 4428 (class 1259 OID 2379209654)
-- Name: card_members_cardId_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "card_members_cardId_employeeId_key" ON public.card_members USING btree ("cardId", "employeeId");


--
-- TOC entry 4461 (class 1259 OID 2379250981)
-- Name: consumptions_employeeId_date_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "consumptions_employeeId_date_idx" ON public.consumptions USING btree ("employeeId", date);


--
-- TOC entry 4462 (class 1259 OID 2379250982)
-- Name: consumptions_lotId_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "consumptions_lotId_idx" ON public.consumptions USING btree ("lotId");


--
-- TOC entry 4465 (class 1259 OID 2379250983)
-- Name: consumptions_requestId_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "consumptions_requestId_idx" ON public.consumptions USING btree ("requestId");


--
-- TOC entry 4394 (class 1259 OID 2379209650)
-- Name: employees_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "employees_employeeId_key" ON public.employees USING btree ("employeeId");


--
-- TOC entry 4395 (class 1259 OID 2379209651)
-- Name: employees_employeeNumber_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "employees_employeeNumber_key" ON public.employees USING btree ("employeeNumber");


--
-- TOC entry 4457 (class 1259 OID 2379250979)
-- Name: grant_lots_dedupKey_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "grant_lots_dedupKey_key" ON public.grant_lots USING btree ("dedupKey");


--
-- TOC entry 4458 (class 1259 OID 2379250980)
-- Name: grant_lots_employeeId_grantDate_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "grant_lots_employeeId_grantDate_idx" ON public.grant_lots USING btree ("employeeId", "grantDate");


--
-- TOC entry 4483 (class 1259 OID 2389382918)
-- Name: leave_history_snapshots_employeeId_grantYear_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "leave_history_snapshots_employeeId_grantYear_idx" ON public.leave_history_snapshots USING btree ("employeeId", "grantYear");


--
-- TOC entry 4484 (class 1259 OID 2389382919)
-- Name: leave_history_snapshots_employeeId_snapshotDate_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "leave_history_snapshots_employeeId_snapshotDate_idx" ON public.leave_history_snapshots USING btree ("employeeId", "snapshotDate");


--
-- TOC entry 4440 (class 1259 OID 2379209656)
-- Name: master_data_type_value_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX master_data_type_value_key ON public.master_data USING btree (type, value);


--
-- TOC entry 4447 (class 1259 OID 2379250977)
-- Name: parttime_grant_schedule_serviceDays_workDaysPerWeek_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "parttime_grant_schedule_serviceDays_workDaysPerWeek_key" ON public.parttime_grant_schedule USING btree ("serviceDays", "workDaysPerWeek");


--
-- TOC entry 4404 (class 1259 OID 2379209652)
-- Name: task_members_taskId_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "task_members_taskId_employeeId_key" ON public.task_members USING btree ("taskId", "employeeId");


--
-- TOC entry 4466 (class 1259 OID 2379250984)
-- Name: time_off_requests_employeeId_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "time_off_requests_employeeId_idx" ON public.time_off_requests USING btree ("employeeId");


--
-- TOC entry 4469 (class 1259 OID 2387464309)
-- Name: time_off_requests_supervisorId_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "time_off_requests_supervisorId_idx" ON public.time_off_requests USING btree ("supervisorId");


--
-- TOC entry 4435 (class 1259 OID 2379209655)
-- Name: user_settings_employeeId_key_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "user_settings_employeeId_key_key" ON public.user_settings USING btree ("employeeId", key);


--
-- TOC entry 4480 (class 1259 OID 2379250989)
-- Name: vacation_app_configs_version_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX vacation_app_configs_version_key ON public.vacation_app_configs USING btree (version);


--
-- TOC entry 4448 (class 1259 OID 2379250978)
-- Name: vacation_balances_employeeId_grantDate_idx; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE INDEX "vacation_balances_employeeId_grantDate_idx" ON public.vacation_balances USING btree ("employeeId", "grantDate");


--
-- TOC entry 4421 (class 1259 OID 2379209653)
-- Name: workspace_members_workspaceId_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "workspace_members_workspaceId_employeeId_key" ON public.workspace_members USING btree ("workspaceId", "employeeId");


--
-- TOC entry 4496 (class 2606 OID 2379255168)
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4521 (class 2606 OID 2379251035)
-- Name: alert_events alert_events_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.alert_events
    ADD CONSTRAINT "alert_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4491 (class 2606 OID 2379255148)
-- Name: attendance attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4522 (class 2606 OID 2379251040)
-- Name: audit_logs audit_logs_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4503 (class 2606 OID 2379209737)
-- Name: board_lists board_lists_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.board_lists
    ADD CONSTRAINT "board_lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4501 (class 2606 OID 2379255184)
-- Name: boards boards_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT "boards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4502 (class 2606 OID 2379209727)
-- Name: boards boards_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT "boards_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4507 (class 2606 OID 2379209757)
-- Name: card_members card_members_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.card_members
    ADD CONSTRAINT "card_members_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public.cards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4508 (class 2606 OID 2379209762)
-- Name: card_members card_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.card_members
    ADD CONSTRAINT "card_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4504 (class 2606 OID 2379209747)
-- Name: cards cards_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT "cards_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4505 (class 2606 OID 2379255189)
-- Name: cards cards_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT "cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4506 (class 2606 OID 2379209742)
-- Name: cards cards_listId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES public.board_lists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4517 (class 2606 OID 2379251015)
-- Name: consumptions consumptions_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.consumptions
    ADD CONSTRAINT "consumptions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4518 (class 2606 OID 2379251025)
-- Name: consumptions consumptions_lotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.consumptions
    ADD CONSTRAINT "consumptions_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES public.grant_lots(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4519 (class 2606 OID 2379251020)
-- Name: consumptions consumptions_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.consumptions
    ADD CONSTRAINT "consumptions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.time_off_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4510 (class 2606 OID 2379209767)
-- Name: custom_folders custom_folders_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.custom_folders
    ADD CONSTRAINT "custom_folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4487 (class 2606 OID 2379255138)
-- Name: evaluations evaluations_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT "evaluations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4509 (class 2606 OID 2379255194)
-- Name: family_members family_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT "family_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4493 (class 2606 OID 2379255158)
-- Name: files files_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4494 (class 2606 OID 2379255163)
-- Name: folders folders_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4495 (class 2606 OID 2379209697)
-- Name: folders folders_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4516 (class 2606 OID 2379251010)
-- Name: grant_lots grant_lots_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.grant_lots
    ADD CONSTRAINT "grant_lots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4523 (class 2606 OID 2389382913)
-- Name: leave_history_snapshots leave_history_snapshots_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.leave_history_snapshots
    ADD CONSTRAINT "leave_history_snapshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4497 (class 2606 OID 2379255174)
-- Name: leave_requests leave_requests_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4492 (class 2606 OID 2379255153)
-- Name: payroll payroll_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT "payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4489 (class 2606 OID 2379209672)
-- Name: task_members task_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.task_members
    ADD CONSTRAINT "task_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4490 (class 2606 OID 2379209667)
-- Name: task_members task_members_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.task_members
    ADD CONSTRAINT "task_members_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4488 (class 2606 OID 2379255143)
-- Name: tasks tasks_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4520 (class 2606 OID 2379251030)
-- Name: time_off_requests time_off_requests_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.time_off_requests
    ADD CONSTRAINT "time_off_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4511 (class 2606 OID 2379255199)
-- Name: user_settings user_settings_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT "user_settings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4512 (class 2606 OID 2379255204)
-- Name: vacation_balances vacation_balances_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_balances
    ADD CONSTRAINT "vacation_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4513 (class 2606 OID 2379255209)
-- Name: vacation_requests vacation_requests_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_requests
    ADD CONSTRAINT "vacation_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4514 (class 2606 OID 2379255219)
-- Name: vacation_usage vacation_usage_balanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_usage
    ADD CONSTRAINT "vacation_usage_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES public.vacation_balances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4515 (class 2606 OID 2379255214)
-- Name: vacation_usage vacation_usage_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.vacation_usage
    ADD CONSTRAINT "vacation_usage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.vacation_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4499 (class 2606 OID 2379209722)
-- Name: workspace_members workspace_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "workspace_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4500 (class 2606 OID 2379209717)
-- Name: workspace_members workspace_members_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4498 (class 2606 OID 2379255179)
-- Name: workspaces workspaces_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT "workspaces_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4677 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: u2t9d5jj58kd56
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- TOC entry 4679 (class 0 OID 0)
-- Dependencies: 270
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: public; Owner: rdsadmin
--

GRANT ALL ON FUNCTION public.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO u2t9d5jj58kd56;


--
-- TOC entry 4314 (class 3466 OID 1632120243)
-- Name: extension_before_drop; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER extension_before_drop ON ddl_command_start
   EXECUTE FUNCTION _heroku.extension_before_drop();


ALTER EVENT TRIGGER extension_before_drop OWNER TO heroku_admin;

--
-- TOC entry 4315 (class 3466 OID 1632120244)
-- Name: log_create_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_create_ext ON ddl_command_end
   EXECUTE FUNCTION _heroku.create_ext();


ALTER EVENT TRIGGER log_create_ext OWNER TO heroku_admin;

--
-- TOC entry 4316 (class 3466 OID 1632120245)
-- Name: log_drop_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_drop_ext ON sql_drop
   EXECUTE FUNCTION _heroku.drop_ext();


ALTER EVENT TRIGGER log_drop_ext OWNER TO heroku_admin;

--
-- TOC entry 4317 (class 3466 OID 1632120247)
-- Name: validate_extension; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER validate_extension ON ddl_command_end
   EXECUTE FUNCTION _heroku.validate_extension();


ALTER EVENT TRIGGER validate_extension OWNER TO heroku_admin;

-- Completed on 2025-11-08 01:47:23 JST

--
-- PostgreSQL database dump complete
--

\unrestrict pePfCfgw1Xa0ZPpO0H4AIfGN8uDmUPpyKSyFEpfXOAv7BThRPRaUQMHJUc7ZSIz

