--
-- PostgreSQL database dump
--

\restrict t0F8IG42cxXg2i2yb9dGGfjeADvi4WylU1mUGfz31ikeC2c9vDcQjrrVejyBDSx

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-1.pgdg24.04+1)

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
-- Name: _heroku; Type: SCHEMA; Schema: -; Owner: heroku_admin
--

CREATE SCHEMA _heroku;


ALTER SCHEMA _heroku OWNER TO heroku_admin;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: u2t9d5jj58kd56
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO u2t9d5jj58kd56;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
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
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands()
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
            WHERE d.datname = current_database()
        );
        --RAISE NOTICE 'Record for event trigger %, objid: %,tag: %, current_user: %, schema: %, database_owenr: %', r.object_identity, r.objid, tg_tag, current_user, schemaname, databaseowner;
        IF r.object_identity = 'address_standardizer_data_us' THEN
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_gaz');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_lex');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_rules');
        ELSIF r.object_identity = 'amcheck' THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.bt_index_check TO %I;', schemaname, databaseowner);
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.bt_index_parent_check TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'dict_int' THEN
            EXECUTE format('ALTER TEXT SEARCH DICTIONARY %I.intdict OWNER TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'pg_partman' THEN
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'part_config');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'part_config_sub');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'custom_time_partitions');
        ELSIF r.object_identity = 'pg_stat_statements' THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.pg_stat_statements_reset TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'postgis' THEN
            PERFORM _heroku.postgis_after_create();
        ELSIF r.object_identity = 'postgis_raster' THEN
            PERFORM _heroku.postgis_after_create();
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT', databaseowner, 'raster_columns');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT', databaseowner, 'raster_overviews');
        ELSIF r.object_identity = 'postgis_topology' THEN
            PERFORM _heroku.postgis_after_create();
            EXECUTE format('GRANT USAGE ON SCHEMA topology TO %I;', databaseowner);
            EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA topology TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('topology', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);
            EXECUTE format('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA topology TO %I;', databaseowner);
        ELSIF r.object_identity = 'postgis_tiger_geocoder' THEN
            PERFORM _heroku.postgis_after_create();
            EXECUTE format('GRANT USAGE ON SCHEMA tiger TO %I;', databaseowner);
            EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tiger TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('tiger', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);

            EXECUTE format('GRANT USAGE ON SCHEMA tiger_data TO %I;', databaseowner);
            EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tiger_data TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('tiger_data', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);
        END IF;
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.create_ext() OWNER TO heroku_admin;

--
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
    FOR r IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
      CONTINUE WHEN r.object_type != 'extension';

      databaseowner = (
            SELECT pg_catalog.pg_get_userbyid(d.datdba)
            FROM pg_catalog.pg_database d
            WHERE d.datname = current_database()
      );

      --RAISE NOTICE 'Record for event trigger %, objid: %,tag: %, current_user: %, database_owner: %, schemaname: %', r.object_identity, r.objid, tg_tag, current_user, databaseowner, r.schema_name;

      IF r.object_identity = 'postgis_topology' THEN
          EXECUTE format('DROP SCHEMA IF EXISTS topology');
      END IF;
    END LOOP;

  END IF;
END;
$$;


ALTER FUNCTION _heroku.drop_ext() OWNER TO heroku_admin;

--
-- Name: extension_before_drop(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.extension_before_drop() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  query TEXT;

BEGIN
  query = (SELECT current_query());

  -- RAISE NOTICE 'executing extension_before_drop: tg_event: %, tg_tag: %, current_user: %, session_user: %, query: %', tg_event, tg_tag, current_user, session_user, query;
  IF tg_tag = 'DROP EXTENSION' and not pg_has_role(session_user, 'rds_superuser', 'MEMBER') THEN
    -- DROP EXTENSION [ IF EXISTS ] name [, ...] [ CASCADE | RESTRICT ]
    IF (regexp_match(query, 'DROP\s+EXTENSION\s+(IF\s+EXISTS)?.*(plpgsql)', 'i') IS NOT NULL) THEN
      RAISE EXCEPTION 'The plpgsql extension is required for database management and cannot be dropped.';
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.extension_before_drop() OWNER TO heroku_admin;

--
-- Name: grant_table_if_exists(text, text, text, text); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.grant_table_if_exists(alias_schemaname text, grants text, databaseowner text, alias_tablename text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  IF alias_tablename IS NULL THEN
    EXECUTE format('GRANT %s ON ALL TABLES IN SCHEMA %I TO %I;', grants, alias_schemaname, databaseowner);
  ELSE
    IF EXISTS (SELECT 1 FROM pg_tables WHERE pg_tables.schemaname = alias_schemaname AND pg_tables.tablename = alias_tablename) THEN
      EXECUTE format('GRANT %s ON TABLE %I.%I TO %I;', grants, alias_schemaname, alias_tablename, databaseowner);
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.grant_table_if_exists(alias_schemaname text, grants text, databaseowner text, alias_tablename text) OWNER TO heroku_admin;

--
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
        WHERE d.datname = current_database()
    );

    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.st_tileenvelope TO %I;', schemaname, databaseowner);
    EXECUTE format('GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE %I.spatial_ref_sys TO %I;', schemaname, databaseowner);
END;
$$;


ALTER FUNCTION _heroku.postgis_after_create() OWNER TO heroku_admin;

--
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
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands()
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
-- Name: attendance; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.attendance (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "clockIn" timestamp(3) without time zone,
    "clockOut" timestamp(3) without time zone,
    status text DEFAULT 'present'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "breakEnd" timestamp(3) without time zone,
    "breakStart" timestamp(3) without time zone
);


ALTER TABLE public.attendance OWNER TO u2t9d5jj58kd56;

--
-- Name: board_lists; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.board_lists (
    id text NOT NULL,
    "boardId" text NOT NULL,
    title text NOT NULL,
    "position" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.board_lists OWNER TO u2t9d5jj58kd56;

--
-- Name: boards; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.boards (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "workspaceId" text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.boards OWNER TO u2t9d5jj58kd56;

--
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
-- Name: cards; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.cards (
    id text NOT NULL,
    "boardId" text NOT NULL,
    "listId" text NOT NULL,
    title text NOT NULL,
    description text,
    "position" integer NOT NULL,
    "dueDate" timestamp(3) without time zone,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'todo'::text NOT NULL,
    "cardColor" text,
    labels jsonb,
    attachments jsonb,
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cards OWNER TO u2t9d5jj58kd56;

--
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
    "orgChartLabel" text
);


ALTER TABLE public.employees OWNER TO u2t9d5jj58kd56;

--
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
-- Name: family_members; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.family_members (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    name text NOT NULL,
    relationship text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "birthDate" timestamp(3) without time zone
);


ALTER TABLE public.family_members OWNER TO u2t9d5jj58kd56;

--
-- Name: files; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.files (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "filePath" text,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "employeeId" text NOT NULL,
    category text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "folderName" text,
    "s3Key" text,
    "taskId" text
);


ALTER TABLE public.files OWNER TO u2t9d5jj58kd56;

--
-- Name: folders; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.folders (
    id text NOT NULL,
    name text NOT NULL,
    "parentId" text,
    "employeeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.folders OWNER TO u2t9d5jj58kd56;

--
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
-- Name: payroll; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.payroll (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    period text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL
);


ALTER TABLE public.payroll OWNER TO u2t9d5jj58kd56;

--
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
-- Name: tasks; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "dueDate" timestamp(3) without time zone,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'todo'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "employeeId" text NOT NULL
);


ALTER TABLE public.tasks OWNER TO u2t9d5jj58kd56;

--
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
-- Name: workspaces; Type: TABLE; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE TABLE public.workspaces (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.workspaces OWNER TO u2t9d5jj58kd56;

--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.activity_logs (id, "userId", "userName", action, module, details, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.attendance (id, "employeeId", date, "clockIn", "clockOut", status, "createdAt", "updatedAt", "breakEnd", "breakStart") FROM stdin;
\.


--
-- Data for Name: board_lists; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.board_lists (id, "boardId", title, "position", "createdAt", "updatedAt") FROM stdin;
cmgqn1plb0006xr0lcrtsxqov	cmgqn1plb0005xr0letcbq7nl	常時運用タスク	0	2025-10-14 14:09:19.056	2025-10-14 14:09:19.056
cmgqn1plb0007xr0lm1oe72j6	cmgqn1plb0005xr0letcbq7nl	予定リスト	1	2025-10-14 14:09:19.056	2025-10-14 14:09:19.056
cmgqn1plb0008xr0l5cun1jke	cmgqn1plb0005xr0letcbq7nl	進行中	2	2025-10-14 14:09:19.056	2025-10-14 14:09:19.056
cmgqn1plb0009xr0lqzji2d9x	cmgqn1plb0005xr0letcbq7nl	完了	3	2025-10-14 14:09:19.056	2025-10-14 14:09:19.056
cmgqp3x4w00142r0lqdaxjr40	cmgqp3x4w00132r0lh2a98ipi	常時運用タスク	0	2025-10-14 15:07:01.376	2025-10-14 15:07:01.376
cmgqp3x4w00152r0l4kirlhq4	cmgqp3x4w00132r0lh2a98ipi	予定リスト	1	2025-10-14 15:07:01.376	2025-10-14 15:07:01.376
cmgqp3x4w00162r0luoz1uatr	cmgqp3x4w00132r0lh2a98ipi	進行中	2	2025-10-14 15:07:01.376	2025-10-14 15:07:01.376
cmgqp3x4w00172r0l1lh6q82d	cmgqp3x4w00132r0lh2a98ipi	完了	3	2025-10-14 15:07:01.376	2025-10-14 15:07:01.376
cmgqp9m6t001t2r0l9tu74yzs	cmgqp9m6t001s2r0lbe5fpjl2	常時運用タスク	0	2025-10-14 15:11:27.125	2025-10-14 15:11:27.125
cmgqp9m6t001u2r0lkjaw1yef	cmgqp9m6t001s2r0lbe5fpjl2	予定リスト	1	2025-10-14 15:11:27.125	2025-10-14 15:11:27.125
cmgqp9m6t001v2r0lanl1pssc	cmgqp9m6t001s2r0lbe5fpjl2	進行中	2	2025-10-14 15:11:27.125	2025-10-14 15:11:27.125
cmgqp9m6t001w2r0lskl70ow0	cmgqp9m6t001s2r0lbe5fpjl2	完了	3	2025-10-14 15:11:27.125	2025-10-14 15:11:27.125
cmgqpdzlz00292r0lic1ekoj5	cmgqpdzlz00282r0l8xjud6g8	常時運用タスク	0	2025-10-14 15:14:51.144	2025-10-14 15:14:51.144
cmgqpdzlz002a2r0lvzcnjni4	cmgqpdzlz00282r0l8xjud6g8	予定リスト	1	2025-10-14 15:14:51.144	2025-10-14 15:14:51.144
cmgqpdzlz002b2r0l1melbo61	cmgqpdzlz00282r0l8xjud6g8	進行中	2	2025-10-14 15:14:51.144	2025-10-14 15:14:51.144
cmgqpdzlz002c2r0lwbf6u72n	cmgqpdzlz00282r0l8xjud6g8	完了	3	2025-10-14 15:14:51.144	2025-10-14 15:14:51.144
cmgosu5qr0008yh0lnxhsx4kt	cmgosu5qo0006yh0lcr6wuh81	ToDo	0	2025-10-13 07:15:52.084	2025-10-13 07:15:52.084
cmgosu5qu000ayh0lpzlf48nf	cmgosu5qo0006yh0lcr6wuh81	進行中	1	2025-10-13 07:15:52.086	2025-10-13 07:15:52.086
cmgosu5qw000cyh0lmpavtz7t	cmgosu5qo0006yh0lcr6wuh81	完了	2	2025-10-13 07:15:52.088	2025-10-13 07:15:52.088
cmgosuxny000lyh0lw3dh6q0l	cmgosuxnw000jyh0lr5p4imsq	ToDo	0	2025-10-13 07:16:28.271	2025-10-13 07:16:28.271
cmgosuxo1000nyh0lhjdo4wzh	cmgosuxnw000jyh0lr5p4imsq	進行中	1	2025-10-13 07:16:28.273	2025-10-13 07:16:28.273
cmgosuxo3000pyh0logwlo1dj	cmgosuxnw000jyh0lr5p4imsq	完了	2	2025-10-13 07:16:28.275	2025-10-13 07:16:28.275
cmgosyt39000yyh0lm1e52w48	cmgosyt36000wyh0ltrpips2x	ToDo	0	2025-10-13 07:19:28.965	2025-10-13 07:19:28.965
cmgosyt3c0010yh0lc3u8xens	cmgosyt36000wyh0ltrpips2x	進行中	1	2025-10-13 07:19:28.968	2025-10-13 07:19:28.968
cmgosyt3e0012yh0lpib56v1g	cmgosyt36000wyh0ltrpips2x	完了	2	2025-10-13 07:19:28.97	2025-10-13 07:19:28.97
cmgpzz8e60006w10l6dgrrv2g	cmgpzz8e60005w10l94356gd6	常時運用タスク	0	2025-10-14 03:23:32.286	2025-10-14 03:23:32.286
cmgpzz8e60007w10lrt4j7njj	cmgpzz8e60005w10l94356gd6	予定リスト	1	2025-10-14 03:23:32.286	2025-10-14 03:23:32.286
cmgpzz8e60008w10lvkhvnstj	cmgpzz8e60005w10l94356gd6	進行中	2	2025-10-14 03:23:32.286	2025-10-14 03:23:32.286
cmgpzz8e60009w10l2sp3pyxm	cmgpzz8e60005w10l94356gd6	完了	3	2025-10-14 03:23:32.286	2025-10-14 03:23:32.286
cmgq0auyw0030w10le4uz606e	cmgq0auyt002yw10lc4aqg4v5	常時運用タスク	0	2025-10-14 03:32:34.761	2025-10-14 03:32:34.761
cmgq0auz00032w10l6ypzdua3	cmgq0auyt002yw10lc4aqg4v5	予定リスト	1	2025-10-14 03:32:34.764	2025-10-14 03:32:34.764
cmgq0auz30034w10lbyya3lxt	cmgq0auyt002yw10lc4aqg4v5	進行中	2	2025-10-14 03:32:34.767	2025-10-14 03:32:34.767
cmgq0auz50036w10lbwd5wjt5	cmgq0auyt002yw10lc4aqg4v5	完了	3	2025-10-14 03:32:34.77	2025-10-14 03:32:34.77
cmgq0gnax003fw10lldt4nit9	cmgq0gnau003dw10ld7uelfb6	常時運用タスク	0	2025-10-14 03:37:04.761	2025-10-14 03:37:04.761
cmgq0gnb0003hw10lkhy1a2si	cmgq0gnau003dw10ld7uelfb6	予定リスト	1	2025-10-14 03:37:04.764	2025-10-14 03:37:04.764
cmgq0gnb2003jw10ll6aigh5m	cmgq0gnau003dw10ld7uelfb6	進行中	2	2025-10-14 03:37:04.767	2025-10-14 03:37:04.767
cmgq0gnb4003lw10lyfkgc92z	cmgq0gnau003dw10ld7uelfb6	完了	3	2025-10-14 03:37:04.769	2025-10-14 03:37:04.769
cmgq0jqbq003uw10lvql63o62	cmgq0jqbn003sw10l65up1gu1	常時運用タスク	0	2025-10-14 03:39:28.646	2025-10-14 03:39:28.646
cmgq0jqbs003ww10ljj785dol	cmgq0jqbn003sw10l65up1gu1	予定リスト	1	2025-10-14 03:39:28.648	2025-10-14 03:39:28.648
cmgq0jqbu003yw10lywkgurcg	cmgq0jqbn003sw10l65up1gu1	進行中	2	2025-10-14 03:39:28.651	2025-10-14 03:39:28.651
cmgq0jqbx0040w10l70ffvsmx	cmgq0jqbn003sw10l65up1gu1	完了	3	2025-10-14 03:39:28.653	2025-10-14 03:39:28.653
cmgq0mqny0049w10ld5mbdwi1	cmgq0mqnw0047w10lj8qwz3ea	常時運用タスク	0	2025-10-14 03:41:49.055	2025-10-14 03:41:49.055
cmgq0mqo1004bw10lfzexn3j8	cmgq0mqnw0047w10lj8qwz3ea	予定リスト	1	2025-10-14 03:41:49.057	2025-10-14 03:41:49.057
cmgq0mqo3004dw10ly8f9o1ld	cmgq0mqnw0047w10lj8qwz3ea	進行中	2	2025-10-14 03:41:49.059	2025-10-14 03:41:49.059
cmgq0mqo5004fw10l76hf6to9	cmgq0mqnw0047w10lj8qwz3ea	完了	3	2025-10-14 03:41:49.061	2025-10-14 03:41:49.061
cmgq0rsab004ow10l82xas8po	cmgq0rsa8004mw10ly7firt2p	常時運用タスク	0	2025-10-14 03:45:44.436	2025-10-14 03:45:44.436
cmgq0rsaf004qw10liuafnwov	cmgq0rsa8004mw10ly7firt2p	予定リスト	1	2025-10-14 03:45:44.44	2025-10-14 03:45:44.44
cmgq0rsah004sw10l2f8i4wtm	cmgq0rsa8004mw10ly7firt2p	進行中	2	2025-10-14 03:45:44.442	2025-10-14 03:45:44.442
cmgq0rsak004uw10la5c3k9y9	cmgq0rsa8004mw10ly7firt2p	完了	3	2025-10-14 03:45:44.444	2025-10-14 03:45:44.444
cmgq0ug7o0053w10lqua01bwa	cmgq0ug7l0051w10lupkuwqvg	常時運用タスク	0	2025-10-14 03:47:48.757	2025-10-14 03:47:48.757
cmgq0ug7r0055w10l18y10we0	cmgq0ug7l0051w10lupkuwqvg	予定リスト	1	2025-10-14 03:47:48.76	2025-10-14 03:47:48.76
cmgq0ug7t0057w10lo2jgnanv	cmgq0ug7l0051w10lupkuwqvg	進行中	2	2025-10-14 03:47:48.762	2025-10-14 03:47:48.762
cmgq0ug7v0059w10l1i8jqtmn	cmgq0ug7l0051w10lupkuwqvg	完了	3	2025-10-14 03:47:48.764	2025-10-14 03:47:48.764
cmgq17idp005iw10lyb4r0nzv	cmgq17idm005gw10lfhfug31n	常時運用タスク	0	2025-10-14 03:57:58.094	2025-10-14 03:57:58.094
cmgq17ids005kw10ll16of08d	cmgq17idm005gw10lfhfug31n	予定リスト	1	2025-10-14 03:57:58.097	2025-10-14 03:57:58.097
cmgq17idu005mw10lplsaor7d	cmgq17idm005gw10lfhfug31n	進行中	2	2025-10-14 03:57:58.099	2025-10-14 03:57:58.099
cmgq17idw005ow10l1pjy43c2	cmgq17idm005gw10lfhfug31n	完了	3	2025-10-14 03:57:58.101	2025-10-14 03:57:58.101
cmgq1ujmp0060w10l410vw1s3	cmgq1ujml005yw10lisnhyn1e	常時運用タスク	0	2025-10-14 04:15:52.801	2025-10-14 04:15:52.801
cmgq1ujms0062w10lo6lhx9mp	cmgq1ujml005yw10lisnhyn1e	予定リスト	1	2025-10-14 04:15:52.804	2025-10-14 04:15:52.804
cmgq1ujmu0064w10lu070l98l	cmgq1ujml005yw10lisnhyn1e	進行中	2	2025-10-14 04:15:52.807	2025-10-14 04:15:52.807
cmgq1ujmx0066w10lnt97ottu	cmgq1ujml005yw10lisnhyn1e	完了	3	2025-10-14 04:15:52.809	2025-10-14 04:15:52.809
cmgq2fb90006gw10lox46l3u3	cmgq2fb8w006ew10lake3fqy4	常時運用タスク	0	2025-10-14 04:32:01.716	2025-10-14 04:32:01.716
cmgq2fb94006iw10lobbkdxjv	cmgq2fb8w006ew10lake3fqy4	予定リスト	1	2025-10-14 04:32:01.72	2025-10-14 04:32:01.72
cmgq2fb96006kw10lh5n18ae7	cmgq2fb8w006ew10lake3fqy4	進行中	2	2025-10-14 04:32:01.723	2025-10-14 04:32:01.723
cmgq2fb99006mw10lw91df1v4	cmgq2fb8w006ew10lake3fqy4	完了	3	2025-10-14 04:32:01.725	2025-10-14 04:32:01.725
cmgq2n2ux0008yh0lsy2yflih	cmgq2n2up0006yh0lnjk0t2wx	常時運用タスク	0	2025-10-14 04:38:04.089	2025-10-14 04:38:04.089
cmgq2n2v4000ayh0l27etli6i	cmgq2n2up0006yh0lnjk0t2wx	予定リスト	1	2025-10-14 04:38:04.097	2025-10-14 04:38:04.097
cmgq2n2vb000cyh0lf9voxl82	cmgq2n2up0006yh0lnjk0t2wx	進行中	2	2025-10-14 04:38:04.103	2025-10-14 04:38:04.103
cmgq2n2vj000eyh0lwsuee9cc	cmgq2n2up0006yh0lnjk0t2wx	完了	3	2025-10-14 04:38:04.111	2025-10-14 04:38:04.111
cmgq3152v000oyh0lwfxdp8l2	cmgq3152m000myh0lx4a43fi0	常時運用タスク	0	2025-10-14 04:49:00.151	2025-10-14 04:49:00.151
cmgq31532000qyh0ljkcuxt47	cmgq3152m000myh0lx4a43fi0	予定リスト	1	2025-10-14 04:49:00.159	2025-10-14 04:49:00.159
cmgq31538000syh0lnlqdczu0	cmgq3152m000myh0lx4a43fi0	進行中	2	2025-10-14 04:49:00.165	2025-10-14 04:49:00.165
cmgq3153n000uyh0leifu998w	cmgq3152m000myh0lx4a43fi0	完了	3	2025-10-14 04:49:00.179	2025-10-14 04:49:00.179
cmgq3f22n0014yh0l9qtav8ak	cmgq3f22g0012yh0ltwvvzwqk	常時運用タスク	0	2025-10-14 04:59:49.44	2025-10-14 04:59:49.44
cmgq3f2350016yh0l8bzhq6bk	cmgq3f22g0012yh0ltwvvzwqk	予定リスト	1	2025-10-14 04:59:49.457	2025-10-14 04:59:49.457
cmgq3f23f0018yh0l9mitphrg	cmgq3f22g0012yh0ltwvvzwqk	進行中	2	2025-10-14 04:59:49.467	2025-10-14 04:59:49.467
cmgq3f23i001ayh0lvqeqgwge	cmgq3f22g0012yh0ltwvvzwqk	完了	3	2025-10-14 04:59:49.47	2025-10-14 04:59:49.47
cmgq3kyb6001jyh0lgoqxunu4	cmgq3kyay001hyh0l8uy55ojx	常時運用タスク	0	2025-10-14 05:04:24.499	2025-10-14 05:04:24.499
cmgq3kybf001lyh0ltie1l2ex	cmgq3kyay001hyh0l8uy55ojx	予定リスト	1	2025-10-14 05:04:24.507	2025-10-14 05:04:24.507
cmgq3kybi001nyh0li31s9jqu	cmgq3kyay001hyh0l8uy55ojx	進行中	2	2025-10-14 05:04:24.511	2025-10-14 05:04:24.511
cmgq3kybq001pyh0l3vjqntmb	cmgq3kyay001hyh0l8uy55ojx	完了	3	2025-10-14 05:04:24.518	2025-10-14 05:04:24.518
cmgq3rzb5001yyh0lbhafeydw	cmgq3rzb1001wyh0lcjqzsztq	常時運用タスク	0	2025-10-14 05:09:52.385	2025-10-14 05:09:52.385
cmgq3rzb80020yh0l8xsfdk1d	cmgq3rzb1001wyh0lcjqzsztq	予定リスト	1	2025-10-14 05:09:52.389	2025-10-14 05:09:52.389
cmgq3rzba0022yh0l445i4uvu	cmgq3rzb1001wyh0lcjqzsztq	進行中	2	2025-10-14 05:09:52.391	2025-10-14 05:09:52.391
cmgq3rzbd0024yh0la1eg527h	cmgq3rzb1001wyh0lcjqzsztq	完了	3	2025-10-14 05:09:52.393	2025-10-14 05:09:52.393
cmgq42vhb002dyh0lrakvz93f	cmgq42vh8002byh0lw2rwbu3q	常時運用タスク	0	2025-10-14 05:18:20.64	2025-10-14 05:18:20.64
cmgq42vhf002fyh0l0h3msdmo	cmgq42vh8002byh0lw2rwbu3q	予定リスト	1	2025-10-14 05:18:20.643	2025-10-14 05:18:20.643
cmgq42vhh002hyh0l0gwbgu3q	cmgq42vh8002byh0lw2rwbu3q	進行中	2	2025-10-14 05:18:20.646	2025-10-14 05:18:20.646
cmgq42vhk002jyh0lctphj9km	cmgq42vh8002byh0lw2rwbu3q	完了	3	2025-10-14 05:18:20.648	2025-10-14 05:18:20.648
cmgq4l6xv002syh0liyhgnppf	cmgq4l6xs002qyh0l085zj05d	常時運用タスク	0	2025-10-14 05:32:35.3	2025-10-14 05:32:35.3
cmgq4l6xy002uyh0lplyj7uhg	cmgq4l6xs002qyh0l085zj05d	予定リスト	1	2025-10-14 05:32:35.303	2025-10-14 05:32:35.303
cmgq4l6y0002wyh0l2zsv1fxe	cmgq4l6xs002qyh0l085zj05d	進行中	2	2025-10-14 05:32:35.305	2025-10-14 05:32:35.305
cmgq4l6y2002yyh0lkj89k86d	cmgq4l6xs002qyh0l085zj05d	完了	3	2025-10-14 05:32:35.307	2025-10-14 05:32:35.307
cmgq4mlbq0037yh0loxyoxih6	cmgq4mlbn0035yh0lad8ivi6p	常時運用タスク	0	2025-10-14 05:33:40.598	2025-10-14 05:33:40.598
cmgq4mlbw0039yh0le3f2pl7t	cmgq4mlbn0035yh0lad8ivi6p	予定リスト	1	2025-10-14 05:33:40.605	2025-10-14 05:33:40.605
cmgq4mlby003byh0lz9bbjl83	cmgq4mlbn0035yh0lad8ivi6p	進行中	2	2025-10-14 05:33:40.607	2025-10-14 05:33:40.607
cmgq4mlc1003dyh0lgv8utwqh	cmgq4mlbn0035yh0lad8ivi6p	完了	3	2025-10-14 05:33:40.609	2025-10-14 05:33:40.609
cmgq4o8t5003myh0loasboic8	cmgq4o8t1003kyh0llcyzaynr	常時運用タスク	0	2025-10-14 05:34:57.689	2025-10-14 05:34:57.689
cmgq4o8t8003oyh0ll6gqlzti	cmgq4o8t1003kyh0llcyzaynr	予定リスト	1	2025-10-14 05:34:57.693	2025-10-14 05:34:57.693
cmgq4o8tb003qyh0lsfjfnkcm	cmgq4o8t1003kyh0llcyzaynr	進行中	2	2025-10-14 05:34:57.695	2025-10-14 05:34:57.695
cmgq4o8td003syh0ljdy1f77y	cmgq4o8t1003kyh0llcyzaynr	完了	3	2025-10-14 05:34:57.697	2025-10-14 05:34:57.697
cmgq51hwa0041yh0lvvynqwi5	cmgq51hw6003zyh0lstqp4ijv	常時運用タスク	0	2025-10-14 05:45:15.994	2025-10-14 05:45:15.994
cmgq51hwd0043yh0l3w045rse	cmgq51hw6003zyh0lstqp4ijv	予定リスト	1	2025-10-14 05:45:15.997	2025-10-14 05:45:15.997
cmgq51hwf0045yh0l2ad0ubsb	cmgq51hw6003zyh0lstqp4ijv	進行中	2	2025-10-14 05:45:16	2025-10-14 05:45:16
cmgq51hwh0047yh0l8vaown5r	cmgq51hw6003zyh0lstqp4ijv	完了	3	2025-10-14 05:45:16.002	2025-10-14 05:45:16.002
cmgq56zpw004gyh0laoq12ohj	cmgq56zps004eyh0lqddpk8jk	常時運用タスク	0	2025-10-14 05:49:32.372	2025-10-14 05:49:32.372
cmgq56zpz004iyh0l1c0cojkg	cmgq56zps004eyh0lqddpk8jk	予定リスト	1	2025-10-14 05:49:32.375	2025-10-14 05:49:32.375
cmgq56zq1004kyh0lskuj3fo0	cmgq56zps004eyh0lqddpk8jk	進行中	2	2025-10-14 05:49:32.378	2025-10-14 05:49:32.378
cmgq56zq5004myh0lo3co9tuw	cmgq56zps004eyh0lqddpk8jk	完了	3	2025-10-14 05:49:32.382	2025-10-14 05:49:32.382
cmgq5hr820008wu0lgyqeorwc	cmgq5hr7z0006wu0li1w628dx	常時運用タスク	0	2025-10-14 05:57:54.578	2025-10-14 05:57:54.578
cmgq5hr85000awu0lpezhrweq	cmgq5hr7z0006wu0li1w628dx	予定リスト	1	2025-10-14 05:57:54.582	2025-10-14 05:57:54.582
cmgq5hr87000cwu0lsw10uvip	cmgq5hr7z0006wu0li1w628dx	進行中	2	2025-10-14 05:57:54.584	2025-10-14 05:57:54.584
cmgq5hr8a000ewu0limha2d07	cmgq5hr7z0006wu0li1w628dx	完了	3	2025-10-14 05:57:54.586	2025-10-14 05:57:54.586
cmgq5luf4000nwu0l63dd2id7	cmgq5luf2000lwu0likv94oxs	常時運用タスク	0	2025-10-14 06:01:05.344	2025-10-14 06:01:05.344
cmgq5luf7000pwu0lwpko5imj	cmgq5luf2000lwu0likv94oxs	予定リスト	1	2025-10-14 06:01:05.347	2025-10-14 06:01:05.347
cmgq5luf9000rwu0ll9ma2r8w	cmgq5luf2000lwu0likv94oxs	進行中	2	2025-10-14 06:01:05.349	2025-10-14 06:01:05.349
cmgq5lufc000twu0lyj5w7pk4	cmgq5luf2000lwu0likv94oxs	完了	3	2025-10-14 06:01:05.352	2025-10-14 06:01:05.352
cmgq5o7k60012wu0lbagn5h4e	cmgq5o7k30010wu0l6ldktt1e	常時運用タスク	0	2025-10-14 06:02:55.686	2025-10-14 06:02:55.686
cmgq5o7k90014wu0l4r68afy6	cmgq5o7k30010wu0l6ldktt1e	予定リスト	1	2025-10-14 06:02:55.689	2025-10-14 06:02:55.689
cmgq5o7kb0016wu0lg0z2yc8m	cmgq5o7k30010wu0l6ldktt1e	進行中	2	2025-10-14 06:02:55.691	2025-10-14 06:02:55.691
cmgq5o7kd0018wu0l8nfp0j0j	cmgq5o7k30010wu0l6ldktt1e	完了	3	2025-10-14 06:02:55.694	2025-10-14 06:02:55.694
cmgq5r5qz001hwu0lxbc5v0m6	cmgq5r5qx001fwu0l8loatw18	常時運用タスク	0	2025-10-14 06:05:13.308	2025-10-14 06:05:13.308
cmgq5r5r1001jwu0l5868n5kp	cmgq5r5qx001fwu0l8loatw18	予定リスト	1	2025-10-14 06:05:13.31	2025-10-14 06:05:13.31
cmgq5r5r4001lwu0ljx1sujbs	cmgq5r5qx001fwu0l8loatw18	進行中	2	2025-10-14 06:05:13.312	2025-10-14 06:05:13.312
cmgq5r5r6001nwu0l0wbvvfgm	cmgq5r5qx001fwu0l8loatw18	完了	3	2025-10-14 06:05:13.314	2025-10-14 06:05:13.314
cmgq5tsd7001wwu0lelchdic6	cmgq5tsd4001uwu0lhyly3nzj	常時運用タスク	0	2025-10-14 06:07:15.931	2025-10-14 06:07:15.931
cmgq5tsd9001ywu0l80ayq5x5	cmgq5tsd4001uwu0lhyly3nzj	予定リスト	1	2025-10-14 06:07:15.933	2025-10-14 06:07:15.933
cmgq5tsdb0020wu0lf0seybzf	cmgq5tsd4001uwu0lhyly3nzj	進行中	2	2025-10-14 06:07:15.935	2025-10-14 06:07:15.935
cmgq5tsdd0022wu0lmtszma79	cmgq5tsd4001uwu0lhyly3nzj	完了	3	2025-10-14 06:07:15.938	2025-10-14 06:07:15.938
cmgq7cedy0008vf0loe4jvceg	cmgq7cedv0006vf0lb00k1w7e	常時運用タスク	0	2025-10-14 06:49:43.894	2025-10-14 06:49:43.894
cmgq7cee0000avf0lxs1rpkxb	cmgq7cedv0006vf0lb00k1w7e	予定リスト	1	2025-10-14 06:49:43.897	2025-10-14 06:49:43.897
cmgq7cee3000cvf0l1zerhgx6	cmgq7cedv0006vf0lb00k1w7e	進行中	2	2025-10-14 06:49:43.899	2025-10-14 06:49:43.899
cmgq7cee4000evf0letq8aof6	cmgq7cedv0006vf0lb00k1w7e	完了	3	2025-10-14 06:49:43.901	2025-10-14 06:49:43.901
cmgqp7gq7001n2r0lzwslsp2y	cmgqp7gq7001m2r0lohbwodtd	常時運用タスク	0	2025-10-14 15:09:46.736	2025-10-14 15:09:46.736
cmgqp7gq7001o2r0lb84bc109	cmgqp7gq7001m2r0lohbwodtd	予定リスト	1	2025-10-14 15:09:46.736	2025-10-14 15:09:46.736
cmgqp7gq7001p2r0l51v0poce	cmgqp7gq7001m2r0lohbwodtd	進行中	2	2025-10-14 15:09:46.736	2025-10-14 15:09:46.736
cmgqp7gq7001q2r0l7w33v3oo	cmgqp7gq7001m2r0lohbwodtd	完了	3	2025-10-14 15:09:46.736	2025-10-14 15:09:46.736
cmgqpady6001z2r0l6is25dj6	cmgqpady6001y2r0lywj6jvgp	常時運用タスク	0	2025-10-14 15:12:03.102	2025-10-14 15:12:03.102
cmgqpady600202r0lhiwt6fwj	cmgqpady6001y2r0lywj6jvgp	予定リスト	1	2025-10-14 15:12:03.102	2025-10-14 15:12:03.102
cmgqpady600212r0ldabqurkz	cmgqpady6001y2r0lywj6jvgp	進行中	2	2025-10-14 15:12:03.102	2025-10-14 15:12:03.102
cmgqpady600222r0loetnicxx	cmgqpady6001y2r0lywj6jvgp	完了	3	2025-10-14 15:12:03.102	2025-10-14 15:12:03.102
cmgt3yzwe0008w60lqqubhqlz	cmgt3yzv20006w60lssarw34d	常時運用タスク	0	2025-10-16 07:38:38.271	2025-10-16 07:38:38.271
cmgt3yzwq000aw60ly4v5997d	cmgt3yzv20006w60lssarw34d	予定リスト	1	2025-10-16 07:38:38.282	2025-10-16 07:38:38.282
cmgt3yzwz000cw60lyxj2bgb6	cmgt3yzv20006w60lssarw34d	進行中	2	2025-10-16 07:38:38.291	2025-10-16 07:38:38.291
cmgt3yzxf000ew60l3vlj7jhn	cmgt3yzv20006w60lssarw34d	完了	3	2025-10-16 07:38:38.308	2025-10-16 07:38:38.308
\.


--
-- Data for Name: boards; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.boards (id, name, description, "workspaceId", "position", "createdBy", "createdAt", "updatedAt") FROM stdin;
cmgosu5qo0006yh0lcr6wuh81	マイボード	個人用のボードです	cmgosu5qi0002yh0lzrm2fbjn	0	cmgosu5qd0000yh0lyf6b4crt	2025-10-13 07:15:52.08	2025-10-13 07:15:52.08
cmgosuxnw000jyh0lr5p4imsq	マイボード	個人用のボードです	cmgosuxnr000fyh0lzg6g8zni	0	cmgosuxno000dyh0lkaw6ku57	2025-10-13 07:16:28.269	2025-10-13 07:16:28.269
cmgosyt36000wyh0ltrpips2x	マイボード	個人用のボードです	cmgosyt2z000syh0l1vgude3g	0	cmgosyt2v000qyh0lg68q9wmt	2025-10-13 07:19:28.962	2025-10-13 07:19:28.962
cmgq7cedv0006vf0lb00k1w7e	マイボード	個人用のボードです	cmgq7cedn0002vf0l0yvbihtk	0	cmgq7cedj0000vf0lkgywyf9d	2025-10-14 06:49:43.891	2025-10-14 06:49:43.891
cmgpzz8e60005w10l94356gd6	メインボード	全体のタスクボードです	cmgpzz82u0001w10ln3lcpzgm	0	cmgnb3tqh0000zq0lze3ot4nh	2025-10-14 03:23:32.286	2025-10-14 03:24:00.296
cmgq0auyt002yw10lc4aqg4v5	マイボード	個人用のボードです	cmgq0auyl002uw10lomm4pyzd	0	cmgq0auyf002sw10lxz2a7q1d	2025-10-14 03:32:34.758	2025-10-14 03:32:34.758
cmgq0gnau003dw10ld7uelfb6	マイボード	個人用のボードです	cmgq0gnal0039w10llc5trntr	0	cmgq0gnah0037w10lu8vg4c2j	2025-10-14 03:37:04.758	2025-10-14 03:37:04.758
cmgq0jqbn003sw10l65up1gu1	マイボード	個人用のボードです	cmgq0jqbh003ow10lkcr5nbvh	0	cmgq0jqbe003mw10l14tmly2h	2025-10-14 03:39:28.643	2025-10-14 03:39:28.643
cmgq0mqnw0047w10lj8qwz3ea	マイボード	個人用のボードです	cmgq0mqnq0043w10lc3kei0pg	0	cmgq0mqnl0041w10lpu2a791v	2025-10-14 03:41:49.052	2025-10-14 03:41:49.052
cmgq0rsa8004mw10ly7firt2p	マイボード	個人用のボードです	cmgq0rsa0004iw10l140x4dhx	0	cmgq0rs9w004gw10lmbsmyeqe	2025-10-14 03:45:44.433	2025-10-14 03:45:44.433
cmgq0ug7l0051w10lupkuwqvg	マイボード	個人用のボードです	cmgq0ug7d004xw10legvxww3m	0	cmgq0ug79004vw10lc0teiuxp	2025-10-14 03:47:48.753	2025-10-14 03:47:48.753
cmgq17idm005gw10lfhfug31n	マイボード	個人用のボードです	cmgq17idf005cw10li1kc0gcb	0	cmgq17ida005aw10l4oayg7hy	2025-10-14 03:57:58.091	2025-10-14 03:57:58.091
cmgq1ujml005yw10lisnhyn1e	マイボード	個人用のボードです	cmgq1ujme005uw10lb1m7w6rs	0	cmgq1ujma005sw10lwb390d1x	2025-10-14 04:15:52.798	2025-10-14 04:15:52.798
cmgq2fb8w006ew10lake3fqy4	マイボード	個人用のボードです	cmgq2fb8n006aw10lvegde085	0	cmgq2fb8h0068w10lykjzdarl	2025-10-14 04:32:01.713	2025-10-14 04:32:01.713
cmgq2n2up0006yh0lnjk0t2wx	マイボード	個人用のボードです	cmgq2n2u30002yh0lkosi755j	0	cmgq2n2tr0000yh0ln6avg3sr	2025-10-14 04:38:04.082	2025-10-14 04:38:04.082
cmgq3152m000myh0lx4a43fi0	マイボード	個人用のボードです	cmgq31520000iyh0l437vfd1d	0	cmgq3151n000gyh0ldd4j1gw4	2025-10-14 04:49:00.142	2025-10-14 04:49:00.142
cmgq3f22g0012yh0ltwvvzwqk	マイボード	個人用のボードです	cmgq3f222000yyh0lzgfbe2rg	0	cmgq3f21u000wyh0lnhvabksk	2025-10-14 04:59:49.432	2025-10-14 04:59:49.432
cmgq3kyay001hyh0l8uy55ojx	マイボード	個人用のボードです	cmgq3kya6001dyh0lolsn5bhl	0	cmgq3ky9v001byh0l3v51ldf3	2025-10-14 05:04:24.491	2025-10-14 05:04:24.491
cmgq3rzb1001wyh0lcjqzsztq	マイボード	個人用のボードです	cmgq3rzau001syh0l9tuxvk3a	0	cmgq3rzam001qyh0ljg3r1w41	2025-10-14 05:09:52.382	2025-10-14 05:09:52.382
cmgq42vh8002byh0lw2rwbu3q	マイボード	個人用のボードです	cmgq42vgx0027yh0lr9acuhe6	0	cmgq42vgs0025yh0lsq74qqw4	2025-10-14 05:18:20.636	2025-10-14 05:18:20.636
cmgq4l6xs002qyh0l085zj05d	マイボード	個人用のボードです	cmgq4l6xl002myh0l6fk5ldct	0	cmgq4l6xh002kyh0lthnbgr7g	2025-10-14 05:32:35.296	2025-10-14 05:32:35.296
cmgq4mlbn0035yh0lad8ivi6p	マイボード	個人用のボードです	cmgq4mlbi0031yh0l84yn8o46	0	cmgq4mlbe002zyh0lyec0sg8q	2025-10-14 05:33:40.595	2025-10-14 05:33:40.595
cmgq4o8t1003kyh0llcyzaynr	マイボード	個人用のボードです	cmgq4o8sr003gyh0lukukptl6	0	cmgq4o8sl003eyh0l3o437le2	2025-10-14 05:34:57.686	2025-10-14 05:34:57.686
cmgq51hw6003zyh0lstqp4ijv	マイボード	個人用のボードです	cmgq51hw0003vyh0l8bdmobz6	0	cmgq51hvw003tyh0l1f208ryw	2025-10-14 05:45:15.991	2025-10-14 05:45:15.991
cmgq56zps004eyh0lqddpk8jk	マイボード	個人用のボードです	cmgq56zpi004ayh0lit0f1pls	0	cmgq56zpb0048yh0l3mei0e40	2025-10-14 05:49:32.369	2025-10-14 05:49:32.369
cmgq5hr7z0006wu0li1w628dx	マイボード	個人用のボードです	cmgq5hr7q0002wu0lyatpf52f	0	cmgq5hr7m0000wu0ljuk5e5lk	2025-10-14 05:57:54.575	2025-10-14 05:57:54.575
cmgq5luf2000lwu0likv94oxs	マイボード	個人用のボードです	cmgq5luew000hwu0li47pcxqu	0	cmgq5luet000fwu0ly0vydm7p	2025-10-14 06:01:05.342	2025-10-14 06:01:05.342
cmgq5o7k30010wu0l6ldktt1e	マイボード	個人用のボードです	cmgq5o7jw000wwu0libyorm02	0	cmgq5o7js000uwu0lvb7wspd1	2025-10-14 06:02:55.683	2025-10-14 06:02:55.683
cmgq5r5qx001fwu0l8loatw18	マイボード	個人用のボードです	cmgq5r5qs001bwu0l9eye8hmm	0	cmgq5r5qo0019wu0lid460t9i	2025-10-14 06:05:13.305	2025-10-14 06:05:13.305
cmgq5tsd4001uwu0lhyly3nzj	マイボード	個人用のボードです	cmgq5tsd0001qwu0l9o8m0nnr	0	cmgq5tscw001owu0l8dtq1az7	2025-10-14 06:07:15.929	2025-10-14 06:07:15.929
cmgqn1plb0005xr0letcbq7nl	メインボード	メインのタスクボードです	cmgqn1pee0001xr0lc3tv56dg	0	cmgnbka6z0001q80l4f83jbzo	2025-10-14 14:09:19.056	2025-10-14 14:09:19.056
cmgqpdzlz00282r0l8xjud6g8	メインボード	メインのタスクボードです	cmgqpdzgg00242r0llpej2jw1	0	cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:14:51.144	2025-10-14 15:15:51.713
cmgqp3x4w00132r0lh2a98ipi	メインボード	メインのタスクボードです	cmgqp3wx9000t2r0lcyik6xb6	0	cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:07:01.376	2025-10-14 15:07:01.376
cmgqp7gq7001m2r0lohbwodtd	全体ボード	全体のタスクボードです	cmgqp7gjt001c2r0lfqwbvygt	0	cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:09:46.736	2025-10-14 15:10:49.652
cmgqp9m6t001s2r0lbe5fpjl2	販促物全般	主にアナログの販促物全般のボード	cmgqp7gjt001c2r0lfqwbvygt	1	cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:11:27.125	2025-10-14 15:11:27.125
cmgqpady6001y2r0lywj6jvgp	HP/SNS等の販促ボード	アナログではない販促について	cmgqp7gjt001c2r0lfqwbvygt	2	cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:12:03.102	2025-10-14 15:12:03.102
cmgt3yzv20006w60lssarw34d	マイボード	個人用のボードです	cmgt3yzsm0002w60lcxl674uq	0	cmgt3yzr30000w60lzyl8am2x	2025-10-16 07:38:38.223	2025-10-16 07:38:38.223
\.


--
-- Data for Name: card_members; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.card_members (id, "cardId", "employeeId", "createdAt") FROM stdin;
cmgqorxio00032r0lklc1rcwe	cmgqoo7ol00012r0lz8ilhbam	cmgnbka6z0001q80l4f83jbzo	2025-10-20 14:05:29.214
cmgqox19j000c2r0lixn3vi71	cmgqots7r00052r0lp9ticmw2	cmgnbka6z0001q80l4f83jbzo	2025-10-20 14:05:29.214
cmgqox19j000d2r0lqy8wb7rn	cmgqots7r00052r0lp9ticmw2	cmgq1ujma005sw10lwb390d1x	2025-10-20 14:05:29.214
cmgqox19j000e2r0lcrf6k23s	cmgqots7r00052r0lp9ticmw2	cmgq2fb8h0068w10lykjzdarl	2025-10-20 14:05:29.214
cmgqox19j000f2r0lby24n5qc	cmgqots7r00052r0lp9ticmw2	cmgq2n2tr0000yh0ln6avg3sr	2025-10-20 14:05:29.214
cmgqox19j000g2r0lzm763nyc	cmgqots7r00052r0lp9ticmw2	cmgq3151n000gyh0ldd4j1gw4	2025-10-20 14:05:29.214
cmgsx40or0005t30lrbuo1yg7	cmgsx2u0y0003t30li75a24r2	cmgq0ug79004vw10lc0teiuxp	2025-10-20 14:05:29.214
cmgsx40or0006t30l3mu13tbi	cmgsx2u0y0003t30li75a24r2	cmgq5hr7m0000wu0ljuk5e5lk	2025-10-20 14:05:29.214
cmgsx40or0007t30l9oyx0we4	cmgsx2u0y0003t30li75a24r2	cmgq56zpb0048yh0l3mei0e40	2025-10-20 14:05:29.214
cmgsx63sz000at30lh5m4qm7x	cmgsx63sy0009t30l0w9axt8i	cmgq0ug79004vw10lc0teiuxp	2025-10-20 14:05:29.214
\.


--
-- Data for Name: cards; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.cards (id, "boardId", "listId", title, description, "position", "dueDate", priority, status, "cardColor", labels, attachments, "isArchived", "createdBy", "createdAt", "updatedAt") FROM stdin;
cmgqots7r00052r0lp9ticmw2	cmgpzz8e60005w10l94356gd6	cmgpzz8e60008w10lvkhvnstj	B型オークの初期運営の確定	五十嵐さんとの連携による初期滑り出しをスムーズにする	0	\N	a1	in-progress	#f0e7f9	[]	[]	f	cmgnbka6z0001q80l4f83jbzo	2025-10-14 14:59:08.439	2025-10-14 15:01:40.137
cmgqoo7ol00012r0lz8ilhbam	cmgqn1plb0005xr0letcbq7nl	cmgqn1plb0007xr0lm1oe72j6	HR Systemのリリース	システムリリースのタスク	0	2025-11-06 15:00:00	b1	scheduled	#c6e5bd	[{"id": "label-2", "name": "重要", "color": "#f59e0b"}]	[]	f	cmgnbka6z0001q80l4f83jbzo	2025-10-14 14:54:48.549	2025-10-14 14:57:42.003
cmgsx2u0y0003t30li75a24r2	cmgqpdzlz00282r0l8xjud6g8	cmgqpdzlz002a2r0lvzcnjni4	test		0	2025-10-29 15:00:00	medium	todo	#f5a3a3	[{"id": "label-1", "name": "緊急", "color": "#ef4444"}]	[]	f	cmgq0ug79004vw10lc0teiuxp	2025-10-16 04:25:39.97	2025-10-16 04:26:35.263
cmgsx63sy0009t30l0w9axt8i	cmgq0ug7l0051w10lupkuwqvg	cmgq0ug7r0055w10l18y10we0	あ		0	\N	medium	todo	\N	\N	\N	f	cmgq0ug79004vw10lc0teiuxp	2025-10-16 04:28:12.61	2025-10-16 04:28:12.61
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.employees (id, "employeeId", "employeeNumber", "employeeType", name, furigana, email, phone, department, "position", organization, team, "joinDate", status, password, role, "myNumber", "userId", url, address, "selfIntroduction", "phoneInternal", "phoneMobile", "birthDate", "createdAt", "updatedAt", "showInOrgChart", "parentEmployeeId", "isInvisibleTop", "isSuspended", "retirementDate", "privacyDisplayName", "privacyOrganization", "privacyDepartment", "privacyPosition", "privacyUrl", "privacyAddress", "privacyBio", "privacyEmail", "privacyWorkPhone", "privacyExtension", "privacyMobilePhone", "privacyBirthDate", "orgChartLabel") FROM stdin;
cmgnb5tiq0000q80l7rjvcdu2	EMP-TOP-000	000	employee	見えないTOP	\N	invisible-top@company.com		経営	未設定	株式会社テックイノベーション	\N	2020-01-01 00:00:00	active	invisible-top-secure-password-2024	admin	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-12 06:13:16.85	2025-10-12 06:13:16.85	t	\N	t	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgohfe6500000i0ljflouhdt	EMP-1760320587387	EMP-1760320587387	employee	ten	テンチョウ	\N	0823278787	["執行部","焼山店"]	["店長"]	["株式会社オオサワ創研"]		2025-10-13 00:00:00	suspended	ten	store_manager	\N			呉市広文化町6-4				\N	2025-10-13 01:56:27.388	2025-10-14 07:34:15.298	f	cmgnbka6z0001q80l4f83jbzo	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgosyt2v000qyh0lg68q9wmt	EMP-1760339968949	EMP-1760339968949	employee	etsu	エツラン	\N		["[]"]	["[]"]	["[]"]		2025-10-13 00:00:00	suspended	etsu2	viewer	\N							\N	2025-10-13 07:19:28.95	2025-10-14 07:33:58.516	f	\N	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgnb3tqh0000zq0lze3ot4nh	EMP-2015-001	EMP-2015-001	employee	admin	アド	oswskn02@gmail.com	0823278787	["総務・管理者"]	["システム管理者"]	["株式会社テックイノベーション"]	システム管理	2015-01-01 00:00:00	suspended	admin	admin	\N			呉市広文化町6-4		0823278788	09082454762	\N	2025-10-12 06:11:43.818	2025-10-14 07:33:11.142	f	\N	f	t	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgnb3tqp0002zq0l1v7m8p7i	EMP-2016-001	EMP-2016-001	employee	sub	サブ	sub@company.com	090-0000-0002	["営業部"]	["サブマネージャー"]	["株式会社テックイノベーション"]	営業	2016-01-01 00:00:00	suspended	sub	sub_manager	\N							\N	2025-10-12 06:11:43.826	2025-10-14 07:34:03.689	f	cmgnb3tqh0000zq0lze3ot4nh	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgnc1n5w0006zt0l53w1jqem	EMP-1760251081603	EMP-1760251081603	employee	somu	\N	\N		["執行部"]	["総務","広報"]	["[\\"株式会社オオサワ創研\\"]"]		2025-10-12 00:00:00	suspended		hr	\N							\N	2025-10-12 06:38:01.604	2025-10-14 11:19:34.063	f	cmgohfe6500000i0ljflouhdt	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgosuxno000dyh0lkaw6ku57	EMP-1760339788259	EMP-1760339788259	employee	somu2	ソウム	\N		["[]"]	["[]"]	["[]"]		2025-10-13 00:00:00	suspended	somu2	hr	\N							\N	2025-10-13 07:16:28.26	2025-10-14 07:34:09.603	f	cmgohfe6500000i0ljflouhdt	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgnb3tqm0001zq0lttuv39bn	EMP-2015-002	EMP-2015-002	employee	mane	マネ	oswskn01@gmail.com	090-0000-0001	["総務・管理者"]	["管理者"]	["株式会社オオサワ創研"]	管理	2015-01-01 00:00:00	suspended	mane	manager	\N			6-4				\N	2025-10-12 06:11:43.822	2025-10-14 07:34:22.88	f	cmgnb3tqh0000zq0lze3ot4nh	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgosu5qd0000yh0lyf6b4crt	EMP-1760339752068	EMP-1760339752068	employee	ippan2	ippan2	\N		["[]"]	["[]"]	["[]"]		2025-10-13 00:00:00	suspended	ippan2	general	\N							\N	2025-10-13 07:15:52.069	2025-10-14 07:33:21.705	f	cmgnb3tqp0002zq0l1v7m8p7i	f	t	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgnb3tqs0003zq0l9dgo6u15	EMP-2017-001	EMP-2017-001	employee	ippan	イッパン	ippan@company.com	090-0000-0003	["営業部"]	["一般社員"]	["株式会社テックイノベーション"]	営業	2017-01-01 00:00:00	suspended	ippan	general	\N							\N	2025-10-12 06:11:43.829	2025-10-14 07:33:52.355	f	cmgnb3tqm0001zq0lttuv39bn	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq0mqnl0041w10lpu2a791v	EMP-1760413309039	031	employee	三島健二	ミシマケンジ	mishima@sooken.com		["執行部","焼山店"]	["店長"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	mishima031	store_manager	\N					0823-33-5873	070-1339-0253	\N	2025-10-14 03:41:49.041	2025-10-16 00:55:14.38	t	cmgq0auyf002sw10lxz2a7q1d	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	焼山店
cmgq0rs9w004gw10lmbsmyeqe	EMP-1760413544418	074	employee	畝河内大	ウネゴウチマサル	unegochi@sooken.com		["チカラもち","執行部","焼山店"]	["チームリーダー"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active		general	\N					0823-33-5873		\N	2025-10-14 03:45:44.419	2025-10-16 00:40:13.849	t	cmgq0mqnl0041w10lpu2a791v	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	チカラもち
cmgq0auyf002sw10lxz2a7q1d	005	005	employee	今井英晃	イマイヒデアキ	imai@sooken.com	080-7127-8266	["執行部","広店"]	["統括店長","執行役員"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	imai5	manager	\N					0823-27-8787	090-8244-5642	\N	2025-10-14 03:32:34.743	2025-10-16 00:52:09.679	t	cmgnbka6z0001q80l4f83jbzo	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	統括店長/執行役員
cmgq0gnah0037w10lu8vg4c2j	015	015	employee	今福正信	イマフクマサノブ	imafuku@sooken.com	080-7128-0015	["執行部","工務部"]	["工務長"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	ima15	store_manager	\N	imafuku				0823278787	090-9061-5195	\N	2025-10-14 03:37:04.745	2025-10-16 00:52:17.372	t	cmgq0auyf002sw10lxz2a7q1d	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	工務部
cmgnbka6z0001q80l4f83jbzo	001	001	employee	大澤仁志	オオサワヒトシ	ohsawa1104@gmail.com	0823278787	["執行部"]	["代表取締役"]	["株式会社オオサワ創研"]		2008-04-01 00:00:00	active	sawa	admin	\N			呉市広古新開8-31-12			09082454762	1975-08-24 00:00:00	2025-10-12 06:24:31.644	2025-10-16 00:52:46.368	t	\N	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	代表
cmgq2fb8h0068w10lykjzdarl	EMP-1760416321671	083	employee	折口大祐	オリグチダイスケ	origuchi@sooken.com	0823-69-7091	["福祉部"]	["サービス管理責任者","管理者"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	ori	sub_manager	\N					0823278787		\N	2025-10-14 04:32:01.673	2025-10-16 00:53:26.27	t	cmgq2n2tr0000yh0ln6avg3sr	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	サービス管理責任者/管理者
cmgq3f21u000wyh0lnhvabksk	069	069	employee	近藤和幸	コンドウカズユキ	kondo@sooken.com	080-7128-0283	["不動産部"]	["アドバイザー"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	kondo069	general	\N					0823-27-8787		\N	2025-10-14 04:59:49.41	2025-10-16 00:53:49.143	t	cmgq0jqbe003mw10l14tmly2h	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq1ujma005sw10lwb390d1x	061	061	employee	多和一	タワハジメ	tawa@azalea.group		["福祉部"]	["福祉長"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active		store_manager	\N					0823-69-7091		\N	2025-10-14 04:15:52.787	2025-10-16 00:54:17.983	t	cmgq1vwlu0067w10liw7h07da	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	福祉長
cmgq0jqbe003mw10l14tmly2h	EMP-1760413168632	007	employee	松島豊	マツシマユタカ	matsushima@sooken.com	080-7128-0444	["執行部","不動産部","広店"]	["店長"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	matsu07	store_manager	\N					0823-27-8787	090-9069-6370	\N	2025-10-14 03:39:28.633	2025-10-16 00:55:05.636	t	cmgq0auyf002sw10lxz2a7q1d	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	不動産部
cmgq17ida005aw10l4oayg7hy	057	057	employee	向井保則	ムカイヤスノリ	mukai@sooken.com	0823-27-8787	["広店","執行部"]	["経理","内勤"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	mu-057	sub_manager	\N							\N	2025-10-14 03:57:58.079	2025-10-16 04:31:35.293	t	cmgq1hgtp005pw10lb76d90w5	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	経理/内勤
cmgq0ug79004vw10lc0teiuxp	021	021	employee	伊藤和博	\N	\N		["総務"]	["一般社員"]	["[\\"株式会社オオサワ創研\\"]"]		2025-10-14 00:00:00	active		general	\N							\N	2025-10-14 03:47:48.742	2025-10-16 04:21:46.241	t	cmgq1hgtp005pw10lb76d90w5	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	総務/広報
cmgq7cedj0000vf0lkgywyf9d	503	503	contractor	増田麻希	マシダアキ	\N	0823-33-5873	["焼山店"]	["内勤"]	["株式会社オオサワ創研"]	\N	2025-10-14 06:49:43.878	active	mashida	general	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-14 06:49:43.88	2025-10-14 06:50:16.783	t	cmgq5hr7m0000wu0ljuk5e5lk	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq1vwlu0067w10liw7h07da	001-COPY-1760415416274	001-COPY	employee	大澤仁志	オオサワヒトシ	\N	0823278787	["執行部"]	["代表取締役"]	["株式会社オオサワ創研"]	\N	2008-04-01 00:00:00	copy	sawa	\N	\N	\N	\N	呉市広古新開8-31-12	\N	\N	09082454762	1975-08-24 00:00:00	2025-10-14 04:16:56.274	2025-10-20 14:12:27.906	t	cmgnbka6z0001q80l4f83jbzo	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	福祉部
cmgq3151n000gyh0ldd4j1gw4	085	085	employee	山本猛	ヤマモトタケシ	yamamoto@azalea.group	0823-69-7091	["福祉部"]	["管理者"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	yama085	sub_manager	\N							\N	2025-10-14 04:49:00.108	2025-10-16 04:30:16.626	t	cmgq2n2tr0000yh0ln6avg3sr	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq4o8sl003eyh0l3o437le2	EMP-1760420097667	oak	employee	B型オーク	\N	\N		["[\\"[]\\"]"]	["[\\"[]\\"]"]	["[\\"[]\\"]"]		2025-10-14 00:00:00	suspended		general	\N							\N	2025-10-14 05:34:57.668	2025-10-15 03:13:09.101	f	\N	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	B型オーク
cmgq4l6xh002kyh0lthnbgr7g	EMP-1760419955283	azalea	employee	GHアザレア	\N	\N		["[\\"[]\\"]"]	["[\\"[]\\"]"]	["[\\"[]\\"]"]		2025-10-14 00:00:00	suspended		general	\N							\N	2025-10-14 05:32:35.285	2025-10-15 03:13:18.077	f	\N	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	GHアザレア
cmgq4mlbe002zyh0lyec0sg8q	EMP-1760420020584	Camellia	employee	GHカメリア	\N	\N		["[\\"[]\\"]"]	["[\\"[]\\"]"]	["[\\"[]\\"]"]		2025-10-14 00:00:00	suspended		general	\N							\N	2025-10-14 05:33:40.586	2025-10-15 03:13:25.64	f	\N	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	GHカメリア
cmgq3ky9v001byh0l3v51ldf3	055	055	employee	細川咲	ホソカワサキ	takadono@sooken.com	0823278787	["不動産部","広店"]	["内勤"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	055hosokawa	sub_manager	\N							\N	2025-10-14 05:04:24.451	2025-10-16 00:38:40.937	t	cmgq3f21u000wyh0lnhvabksk	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq5tscw001owu0l8dtq1az7	086	086	employee	岡田大樹	オカダダイキ	d_okada@sooken.com	0823-33-5873	["焼山店"]	["アドバイザー"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	oka086	general	\N							\N	2025-10-14 06:07:15.921	2025-10-16 00:52:54.846	t	cmgq0mqnl0041w10lpu2a791v	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq2n2tr0000yh0ln6avg3sr	077	077	employee	小田孝博	オダタカヒロ	oda@azalea.group	080-7128-0040	["福祉部"]	["サービス管理責任者","管理者"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	oda.077	sub_manager	\N					0823-69-7091		\N	2025-10-14 04:38:04.048	2025-10-16 00:53:06.681	t	cmgq1ujma005sw10lwb390d1x	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	サービス管理責任者/管理者
cmgq3rzam001qyh0ljg3r1w41	014	014	employee	桑原雅則	クワバラマサノリ	kuwabara@sooken.com	080-7128-0013	["広店"]	["アドバイザー"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	kuwa014	general	\N					0823-27-8787	090-6435-9035	\N	2025-10-14 05:09:52.366	2025-10-16 00:53:37.573	t	cmgq1hgtp005pw10lb76d90w5	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq5r5qo0019wu0lid460t9i	080	080	employee	城健太	ジョウケンタ	jyo@sooken.com		["チカラもち","焼山店"]	["工務"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	jyo80	general	\N					0823-27-8787		\N	2025-10-14 06:05:13.297	2025-10-16 00:54:00.345	t	cmgq0rs9w004gw10lmbsmyeqe	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq51hvw003tyh0l1f208ryw	046	046	employee	高橋和美	タカハシカズミ	takahashi@sooken.com	0823-27-8787	["広店"]	["内勤","プランナー"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	takahashi46	sub_manager	\N							\N	2025-10-14 05:45:15.98	2025-10-16 00:54:10.826	t	cmgq0ug79004vw10lc0teiuxp	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	内勤/プランナー
cmgq5luet000fwu0ly0vydm7p	060	060	employee	筒井高文	ツツイタカフミ	tsutsui@sooken.com		["工務部"]	["工務"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	tsu060	general	\N			6-4		0823-27-8787		\N	2025-10-14 06:01:05.333	2025-10-16 00:54:29.107	t	cmgq0gnah0037w10lu8vg4c2j	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq5o7js000uwu0lvb7wspd1	041	041	employee	野田博嗣	ノダヒロツグ	noda@sooken.com		["工務部"]	["工務"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	noda41	general	\N					0823-27-8787		\N	2025-10-14 06:02:55.672	2025-10-16 00:54:41.7	t	cmgq5luet000fwu0ly0vydm7p	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq42vgs0025yh0lsq74qqw4	047	047	employee	藤井雄大	フジイユウダイ	fujii@sooken.com		["広店"]	["アドバイザー"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	fujii47	general	\N					0823-27-8787		\N	2025-10-14 05:18:20.621	2025-10-16 00:54:50.258	t	cmgq3rzam001qyh0ljg3r1w41	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq5hr7m0000wu0ljuk5e5lk	082	082	employee	三島美緒	ミシマミオ	m_mishima@sooken.com	0823-33-5873	["焼山店"]	["広報","内勤"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	mishi082	sub_manager	\N							\N	2025-10-14 05:57:54.562	2025-10-16 00:55:24.069	t	cmgq0mqnl0041w10lpu2a791v	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	広報/内勤
cmgq56zpb0048yh0l3mei0e40	067	067	employee	八木栄津子	ヤギエツコ	yagi@sooken.com	0823-27-8787	["広店"]	["広報","内勤"]	["株式会社オオサワ創研"]		2025-10-14 00:00:00	active	ya-gi067	sub_manager	\N							\N	2025-10-14 05:49:32.351	2025-10-16 00:55:43.461	t	cmgq0ug79004vw10lc0teiuxp	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	広報/内勤
cmgt3yzr30000w60lzyl8am2x	EMP-1760600318002	EMP-1760600318002	employee	テスト	\N	\N		["[]"]	["[]"]	["[]"]		2025-10-16 07:38:38.002	active		general	\N							\N	2025-10-16 07:38:38.003	2025-10-16 07:39:44.673	f	\N	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
cmgq1hgtp005pw10lb76d90w5	005-COPY-1760414742637	005-COPY	employee	今井英晃	イマイヒデアキ	\N	080-7127-8266	["執行部","広店"]	["統括店長","執行役員"]	["株式会社オオサワ創研"]	\N	2025-10-14 03:32:34.742	copy	imai5	\N	\N	\N	\N	\N	\N	0823-27-8787	090-8244-5642	\N	2025-10-14 04:05:42.638	2025-10-20 14:12:18.203	t	cmgq0auyf002sw10lxz2a7q1d	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	広店
cmgqrhyep0000w60l4imy14yk	EMP-1760419955283-COPY-1760458435440	azalea-COPY	employee	GHアザレア	ン.グループホームアザレア	\N		["[]"]	["[]"]	["[]"]		2025-10-14 00:00:00	copy	gh	\N	\N							\N	2025-10-14 16:13:55.441	2025-10-20 14:12:39.886	t	cmgq1ujma005sw10lwb390d1x	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	GHアザレア
cmgqri43j0001w60l6e5fpzey	EMP-1760420020584-COPY-1760458442815	Camellia-COPY	employee	GHカメリア	ン.グループホームカメリア	\N		["[]"]	["[]"]	["[]"]		2025-10-14 00:00:00	copy	gh	\N	\N							\N	2025-10-14 16:14:02.816	2025-10-20 14:12:47.714	t	cmgq1ujma005sw10lwb390d1x	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	GHカメリア
cmgqri8ub0002w60ll1nuikds	EMP-1760420097667-COPY-1760458448962	oak-COPY	employee	B型オーク	ン.ビーガタオーク	\N		["[]"]	["[]"]	["[]"]		2025-10-14 00:00:00	copy	bgata	\N	\N							\N	2025-10-14 16:14:08.963	2025-10-20 14:12:57.292	t	cmgq1ujma005sw10lwb390d1x	f	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	B型オーク
\.


--
-- Data for Name: evaluations; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.evaluations (id, "employeeId", period, evaluator, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: family_members; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.family_members (id, "employeeId", name, relationship, "createdAt", "updatedAt", "birthDate") FROM stdin;
cmgqgzet30000t40l9sonlxhs	cmgnc1n5w0006zt0l53w1jqem			2025-10-14 11:19:34.072	2025-10-14 11:19:34.072	\N
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.files (id, filename, "originalName", "filePath", "fileSize", "mimeType", "employeeId", category, "createdAt", "folderName", "s3Key", "taskId") FROM stdin;
cmgnc7qba000azt0lkmiwi0jl	1760251364621_070926_4.pdf	070926_4.pdf	cmgnb3tqh0000zq0lze3ot4nh/task/1760251364621_070926_4.pdf	86344	application/pdf	cmgnb3tqh0000zq0lze3ot4nh	task	2025-10-12 06:42:45.622	資料	\N	\N
cmgnc993h000hzt0ljwwxjer4	1760251435677_070926_4.pdf	070926_4.pdf	cmgnb3tqh0000zq0lze3ot4nh/task/1760251435677_070926_4.pdf	86344	application/pdf	cmgnb3tqh0000zq0lze3ot4nh	task	2025-10-12 06:43:56.621	資料	\N	\N
cmgoiagqp0000tw0l57g4xxi1	1760322036051_070926_4.pdf	070926_4.pdf	cmgnb3tqh0000zq0lze3ot4nh/task/1760322036051_070926_4.pdf	86344	application/pdf	cmgnb3tqh0000zq0lze3ot4nh	task	2025-10-13 02:20:37.058	資料	\N	\N
cmgp2hs5o0000se0lhnl4izc2	1760355969759_スクリーンショット 2025-08-27 21.32.44.png	スクリーンショット 2025-08-27 21.32.44.png	cmgnb3tqh0000zq0lze3ot4nh/employee/1760355969759_スクリーンショット 2025-08-27 21.32.44.png	78504	image/png	cmgnb3tqh0000zq0lze3ot4nh	employee	2025-10-13 11:46:10.765	契約書類	\N	\N
cmgp2id400001se0lx0yztzq5	1760355997223_無題のドキュメント.docx	無題のドキュメント.docx	cmgnb3tqh0000zq0lze3ot4nh/task/1760355997223_無題のドキュメント.docx	11925	application/vnd.openxmlformats-officedocument.wordprocessingml.document	cmgnb3tqh0000zq0lze3ot4nh	task	2025-10-13 11:46:37.92	資料	\N	\N
cmgqn4fky0001xd0lhh1d9r3s	1760451085048_スクリーンショット 2025-08-27 21.32.44.png	スクリーンショット 2025-08-27 21.32.44.png	cmgnbka6z0001q80l4f83jbzo/task/1760451085048_スクリーンショット 2025-08-27 21.32.44.png	78504	image/png	cmgnbka6z0001q80l4f83jbzo	task	2025-10-14 14:11:26.051	資料	\N	\N
cmgqnalkl0002xd0ladqbuxxk	1760451372661_070926_4.pdf	070926_4.pdf	cmgnbka6z0001q80l4f83jbzo/task/1760451372661_070926_4.pdf	86344	application/pdf	cmgnbka6z0001q80l4f83jbzo	task	2025-10-14 14:16:13.749	資料	\N	\N
cmgswnr1g0001t30ly63bt21i	1760588035329_富士通ノートパソコン見積書.pdf	富士通ノートパソコン見積書.pdf	cmgq0ug79004vw10lc0teiuxp/general/1760588035329_富士通ノートパソコン見積書.pdf	60404	application/pdf	cmgq0ug79004vw10lc0teiuxp	general	2025-10-16 04:13:56.26	2025年度	\N	\N
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.folders (id, name, "parentId", "employeeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.leave_requests (id, "employeeId", "startDate", "endDate", type, reason, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: payroll; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.payroll (id, "employeeId", period, status, "createdAt", "updatedAt", amount) FROM stdin;
\.


--
-- Data for Name: task_members; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.task_members (id, "taskId", "employeeId", "createdAt") FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.tasks (id, title, description, "dueDate", priority, status, "createdAt", "updatedAt", "employeeId") FROM stdin;
\.


--
-- Data for Name: workspace_members; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.workspace_members (id, "workspaceId", "employeeId", role, "createdAt") FROM stdin;
cmgosu5ql0004yh0l3lyb3q7w	cmgosu5qi0002yh0lzrm2fbjn	cmgosu5qd0000yh0lyf6b4crt	workspace_admin	2025-10-20 14:05:29.245
cmgosuxnu000hyh0lxm95kyn6	cmgosuxnr000fyh0lzg6g8zni	cmgosuxno000dyh0lkaw6ku57	workspace_admin	2025-10-20 14:05:29.245
cmgosyt32000uyh0lllhijxbd	cmgosyt2z000syh0l1vgude3g	cmgosyt2v000qyh0lg68q9wmt	workspace_admin	2025-10-20 14:05:29.245
cmgq01ia7000xw10l0x744u8z	cmgpzz82u0001w10ln3lcpzgm	cmgnbka6z0001q80l4f83jbzo	workspace_member	2025-10-20 14:05:29.245
cmgq0auyq002ww10l86y20n22	cmgq0auyl002uw10lomm4pyzd	cmgq0auyf002sw10lxz2a7q1d	workspace_admin	2025-10-20 14:05:29.245
cmgq0gnap003bw10lwlf9eh4x	cmgq0gnal0039w10llc5trntr	cmgq0gnah0037w10lu8vg4c2j	workspace_admin	2025-10-20 14:05:29.245
cmgq0jqbk003qw10lsrfhqkf3	cmgq0jqbh003ow10lkcr5nbvh	cmgq0jqbe003mw10l14tmly2h	workspace_admin	2025-10-20 14:05:29.245
cmgq0mqnt0045w10lxyhv31hr	cmgq0mqnq0043w10lc3kei0pg	cmgq0mqnl0041w10lpu2a791v	workspace_admin	2025-10-20 14:05:29.245
cmgq0rsa4004kw10l045wgb9k	cmgq0rsa0004iw10l140x4dhx	cmgq0rs9w004gw10lmbsmyeqe	workspace_admin	2025-10-20 14:05:29.245
cmgq0ug7h004zw10lvh02y5fj	cmgq0ug7d004xw10legvxww3m	cmgq0ug79004vw10lc0teiuxp	workspace_admin	2025-10-20 14:05:29.245
cmgq17idi005ew10l000ya5d2	cmgq17idf005cw10li1kc0gcb	cmgq17ida005aw10l4oayg7hy	workspace_admin	2025-10-20 14:05:29.245
cmgq1ujmi005ww10ltbf8sln9	cmgq1ujme005uw10lb1m7w6rs	cmgq1ujma005sw10lwb390d1x	workspace_admin	2025-10-20 14:05:29.245
cmgq2fb8s006cw10lomzbhu12	cmgq2fb8n006aw10lvegde085	cmgq2fb8h0068w10lykjzdarl	workspace_admin	2025-10-20 14:05:29.245
cmgq2n2uf0004yh0lckw9nnnl	cmgq2n2u30002yh0lkosi755j	cmgq2n2tr0000yh0ln6avg3sr	workspace_admin	2025-10-20 14:05:29.245
cmgq3152c000kyh0lhwioxggz	cmgq31520000iyh0l437vfd1d	cmgq3151n000gyh0ldd4j1gw4	workspace_admin	2025-10-20 14:05:29.245
cmgq3f22b0010yh0lfh0umt6f	cmgq3f222000yyh0lzgfbe2rg	cmgq3f21u000wyh0lnhvabksk	workspace_admin	2025-10-20 14:05:29.245
cmgq3kyam001fyh0lc3ba9z38	cmgq3kya6001dyh0lolsn5bhl	cmgq3ky9v001byh0l3v51ldf3	workspace_admin	2025-10-20 14:05:29.245
cmgq3rzax001uyh0lthc9cbhp	cmgq3rzau001syh0l9tuxvk3a	cmgq3rzam001qyh0ljg3r1w41	workspace_admin	2025-10-20 14:05:29.245
cmgq42vh30029yh0llds25iyc	cmgq42vgx0027yh0lr9acuhe6	cmgq42vgs0025yh0lsq74qqw4	workspace_admin	2025-10-20 14:05:29.245
cmgq4l6xp002oyh0l69rua6il	cmgq4l6xl002myh0l6fk5ldct	cmgq4l6xh002kyh0lthnbgr7g	workspace_admin	2025-10-20 14:05:29.245
cmgq4mlbk0033yh0lcog8qn4t	cmgq4mlbi0031yh0l84yn8o46	cmgq4mlbe002zyh0lyec0sg8q	workspace_admin	2025-10-20 14:05:29.245
cmgq4o8sv003iyh0l62baxd7c	cmgq4o8sr003gyh0lukukptl6	cmgq4o8sl003eyh0l3o437le2	workspace_admin	2025-10-20 14:05:29.245
cmgq51hw3003xyh0lk15u4yrr	cmgq51hw0003vyh0l8bdmobz6	cmgq51hvw003tyh0l1f208ryw	workspace_admin	2025-10-20 14:05:29.245
cmgq56zpm004cyh0lxm4kjl4g	cmgq56zpi004ayh0lit0f1pls	cmgq56zpb0048yh0l3mei0e40	workspace_admin	2025-10-20 14:05:29.245
cmgq5hr7u0004wu0l200jn98o	cmgq5hr7q0002wu0lyatpf52f	cmgq5hr7m0000wu0ljuk5e5lk	workspace_admin	2025-10-20 14:05:29.245
cmgq5luez000jwu0ljdu0flt0	cmgq5luew000hwu0li47pcxqu	cmgq5luet000fwu0ly0vydm7p	workspace_admin	2025-10-20 14:05:29.245
cmgq5o7jz000ywu0leatqurkz	cmgq5o7jw000wwu0libyorm02	cmgq5o7js000uwu0lvb7wspd1	workspace_admin	2025-10-20 14:05:29.245
cmgq5r5qu001dwu0lxhnrstig	cmgq5r5qs001bwu0l9eye8hmm	cmgq5r5qo0019wu0lid460t9i	workspace_admin	2025-10-20 14:05:29.245
cmgq5tsd2001swu0lmal3ijrw	cmgq5tsd0001qwu0l9o8m0nnr	cmgq5tscw001owu0l8dtq1az7	workspace_admin	2025-10-20 14:05:29.245
cmgq659uz0028wu0lvyma92r5	cmgpzz82u0001w10ln3lcpzgm	cmgq0ug79004vw10lc0teiuxp	workspace_member	2025-10-20 14:05:29.245
cmgq659uz0029wu0l0tf6pknm	cmgpzz82u0001w10ln3lcpzgm	cmgq17ida005aw10l4oayg7hy	workspace_member	2025-10-20 14:05:29.245
cmgq659uz002bwu0lyzwrd22v	cmgpzz82u0001w10ln3lcpzgm	cmgq1ujma005sw10lwb390d1x	workspace_member	2025-10-20 14:05:29.245
cmgq659uz002dwu0lbkt7wyoo	cmgpzz82u0001w10ln3lcpzgm	cmgq2fb8h0068w10lykjzdarl	workspace_member	2025-10-20 14:05:29.245
cmgq659uz002ewu0lblx93rzf	cmgpzz82u0001w10ln3lcpzgm	cmgq2n2tr0000yh0ln6avg3sr	workspace_member	2025-10-20 14:05:29.245
cmgq659uz002fwu0l1bq4axsu	cmgpzz82u0001w10ln3lcpzgm	cmgq3151n000gyh0ldd4j1gw4	workspace_member	2025-10-20 14:05:29.245
cmgq7cedq0004vf0llrvceibl	cmgq7cedn0002vf0l0yvbihtk	cmgq7cedj0000vf0lkgywyf9d	workspace_admin	2025-10-20 14:05:29.245
cmgqn1pee0003xr0lmwr1s87e	cmgqn1pee0001xr0lc3tv56dg	cmgnbka6z0001q80l4f83jbzo	workspace_admin	2025-10-20 14:05:29.245
cmgqp3wx9000v2r0ls0hykp3d	cmgqp3wx9000t2r0lcyik6xb6	cmgnbka6z0001q80l4f83jbzo	workspace_admin	2025-10-20 14:05:29.245
cmgqp3wx9000w2r0lhtt354y2	cmgqp3wx9000t2r0lcyik6xb6	cmgq0auyf002sw10lxz2a7q1d	workspace_member	2025-10-20 14:05:29.245
cmgqp3wx9000x2r0ln835bwz7	cmgqp3wx9000t2r0lcyik6xb6	cmgq0jqbe003mw10l14tmly2h	workspace_member	2025-10-20 14:05:29.245
cmgqp3wx9000y2r0l2f0hmq0f	cmgqp3wx9000t2r0lcyik6xb6	cmgq0gnah0037w10lu8vg4c2j	workspace_member	2025-10-20 14:05:29.245
cmgqp3wx9000z2r0l48vq8c9f	cmgqp3wx9000t2r0lcyik6xb6	cmgq0ug79004vw10lc0teiuxp	workspace_member	2025-10-20 14:05:29.245
cmgqp3wx900102r0lzm6q7w1t	cmgqp3wx9000t2r0lcyik6xb6	cmgq3f21u000wyh0lnhvabksk	workspace_member	2025-10-20 14:05:29.245
cmgqp3wx900112r0lqwhju9au	cmgqp3wx9000t2r0lcyik6xb6	cmgq3ky9v001byh0l3v51ldf3	workspace_member	2025-10-20 14:05:29.245
cmgqp7gjt001e2r0lvu6xskj9	cmgqp7gjt001c2r0lfqwbvygt	cmgnbka6z0001q80l4f83jbzo	workspace_admin	2025-10-20 14:05:29.245
cmgqp7gjt001f2r0lbrtaswcq	cmgqp7gjt001c2r0lfqwbvygt	cmgq0auyf002sw10lxz2a7q1d	workspace_member	2025-10-20 14:05:29.245
cmgqp7gjt001g2r0lg23j8mah	cmgqp7gjt001c2r0lfqwbvygt	cmgq0jqbe003mw10l14tmly2h	workspace_member	2025-10-20 14:05:29.245
cmgqp7gjt001h2r0l8hswy4qa	cmgqp7gjt001c2r0lfqwbvygt	cmgq0mqnl0041w10lpu2a791v	workspace_member	2025-10-20 14:05:29.245
cmgqp7gjt001i2r0lc72zsa1c	cmgqp7gjt001c2r0lfqwbvygt	cmgq0ug79004vw10lc0teiuxp	workspace_member	2025-10-20 14:05:29.245
cmgqp7gjt001j2r0lp1ckpur3	cmgqp7gjt001c2r0lfqwbvygt	cmgq56zpb0048yh0l3mei0e40	workspace_member	2025-10-20 14:05:29.245
cmgqp7gjt001k2r0lyl31k3zr	cmgqp7gjt001c2r0lfqwbvygt	cmgq5hr7m0000wu0ljuk5e5lk	workspace_member	2025-10-20 14:05:29.245
cmgqpdzgg00262r0lzgyf74z2	cmgqpdzgg00242r0llpej2jw1	cmgnbka6z0001q80l4f83jbzo	workspace_admin	2025-10-20 14:05:29.245
cmgqpelly002d2r0li99cz7b9	cmgqpdzgg00242r0llpej2jw1	cmgq7cedj0000vf0lkgywyf9d	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002e2r0llervwtwx	cmgqpdzgg00242r0llpej2jw1	cmgq5tscw001owu0l8dtq1az7	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002f2r0l3rc628qi	cmgqpdzgg00242r0llpej2jw1	cmgq5r5qo0019wu0lid460t9i	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002g2r0lyafsk97u	cmgqpdzgg00242r0llpej2jw1	cmgq5o7js000uwu0lvb7wspd1	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002h2r0le9kq8dje	cmgqpdzgg00242r0llpej2jw1	cmgq5luet000fwu0ly0vydm7p	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002i2r0l9c023jk8	cmgqpdzgg00242r0llpej2jw1	cmgq5hr7m0000wu0ljuk5e5lk	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002j2r0l0le7shjf	cmgqpdzgg00242r0llpej2jw1	cmgq56zpb0048yh0l3mei0e40	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002k2r0l4pwmm7cd	cmgqpdzgg00242r0llpej2jw1	cmgq51hvw003tyh0l1f208ryw	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002m2r0l7jgrkl13	cmgqpdzgg00242r0llpej2jw1	cmgq42vgs0025yh0lsq74qqw4	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002n2r0l6nulbok0	cmgqpdzgg00242r0llpej2jw1	cmgq3rzam001qyh0ljg3r1w41	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002o2r0l7i4i9ceo	cmgqpdzgg00242r0llpej2jw1	cmgq3ky9v001byh0l3v51ldf3	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002p2r0lrv0q7ogi	cmgqpdzgg00242r0llpej2jw1	cmgq3151n000gyh0ldd4j1gw4	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002q2r0lc8t5840y	cmgqpdzgg00242r0llpej2jw1	cmgq3f21u000wyh0lnhvabksk	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002r2r0l6ggr36la	cmgqpdzgg00242r0llpej2jw1	cmgq2n2tr0000yh0ln6avg3sr	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002s2r0ljsaj21r8	cmgqpdzgg00242r0llpej2jw1	cmgq2fb8h0068w10lykjzdarl	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002t2r0lt311y0oh	cmgqpdzgg00242r0llpej2jw1	cmgq1ujma005sw10lwb390d1x	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002u2r0lm1ezn20v	cmgqpdzgg00242r0llpej2jw1	cmgq17ida005aw10l4oayg7hy	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002v2r0lmknubafx	cmgqpdzgg00242r0llpej2jw1	cmgq0ug79004vw10lc0teiuxp	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002w2r0lll2f1uca	cmgqpdzgg00242r0llpej2jw1	cmgq0rs9w004gw10lmbsmyeqe	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002x2r0l42d6ekc1	cmgqpdzgg00242r0llpej2jw1	cmgq0mqnl0041w10lpu2a791v	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002y2r0lmyejxfj7	cmgqpdzgg00242r0llpej2jw1	cmgq0jqbe003mw10l14tmly2h	workspace_member	2025-10-20 14:05:29.245
cmgqpelly002z2r0lq8ppwscf	cmgqpdzgg00242r0llpej2jw1	cmgq0gnah0037w10lu8vg4c2j	workspace_member	2025-10-20 14:05:29.245
cmgqpelly00302r0lo4s3he0n	cmgqpdzgg00242r0llpej2jw1	cmgq0auyf002sw10lxz2a7q1d	workspace_member	2025-10-20 14:05:29.245
cmgt3yzti0004w60l7t9vw29r	cmgt3yzsm0002w60lcxl674uq	cmgt3yzr30000w60lzyl8am2x	workspace_admin	2025-10-20 14:05:29.245
\.


--
-- Data for Name: workspaces; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.workspaces (id, name, description, "createdBy", "createdAt", "updatedAt") FROM stdin;
cmgq7cedn0002vf0l0yvbihtk	増田麻希のマイワークスペース	個人用のワークスペースです	cmgq7cedj0000vf0lkgywyf9d	2025-10-14 06:49:43.884	2025-10-14 06:49:43.884
cmgqn1pee0001xr0lc3tv56dg	マイワークスペース	自分のワークスペース	cmgnbka6z0001q80l4f83jbzo	2025-10-14 14:09:18.806	2025-10-14 14:09:18.806
cmgqpdzgg00242r0llpej2jw1	会社全体ワークスペース	会社全体・専門的に属さない汎用タスク管理	cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:14:50.944	2025-10-14 15:15:41.408
cmgosu5qi0002yh0lzrm2fbjn	ippan2のマイワークスペース	個人用のワークスペースです	cmgosu5qd0000yh0lyf6b4crt	2025-10-13 07:15:52.074	2025-10-13 07:15:52.074
cmgosuxnr000fyh0lzg6g8zni	somu2のマイワークスペース	個人用のワークスペースです	cmgosuxno000dyh0lkaw6ku57	2025-10-13 07:16:28.264	2025-10-13 07:16:28.264
cmgosyt2z000syh0l1vgude3g	etsuのマイワークスペース	個人用のワークスペースです	cmgosyt2v000qyh0lg68q9wmt	2025-10-13 07:19:28.955	2025-10-13 07:19:28.955
cmgq0auyl002uw10lomm4pyzd	今井英晃のマイワークスペース	個人用のワークスペースです	cmgq0auyf002sw10lxz2a7q1d	2025-10-14 03:32:34.75	2025-10-14 03:32:34.75
cmgq0gnal0039w10llc5trntr	今福正信のマイワークスペース	個人用のワークスペースです	cmgq0gnah0037w10lu8vg4c2j	2025-10-14 03:37:04.75	2025-10-14 03:37:04.75
cmgq0jqbh003ow10lkcr5nbvh	松島豊のマイワークスペース	個人用のワークスペースです	cmgq0jqbe003mw10l14tmly2h	2025-10-14 03:39:28.638	2025-10-14 03:39:28.638
cmgq0mqnq0043w10lc3kei0pg	三島健二のマイワークスペース	個人用のワークスペースです	cmgq0mqnl0041w10lpu2a791v	2025-10-14 03:41:49.046	2025-10-14 03:41:49.046
cmgq0rsa0004iw10l140x4dhx	畝河内大のマイワークスペース	個人用のワークスペースです	cmgq0rs9w004gw10lmbsmyeqe	2025-10-14 03:45:44.424	2025-10-14 03:45:44.424
cmgq0ug7d004xw10legvxww3m	伊藤和博のマイワークスペース	個人用のワークスペースです	cmgq0ug79004vw10lc0teiuxp	2025-10-14 03:47:48.746	2025-10-14 03:47:48.746
cmgq17idf005cw10li1kc0gcb	向井保則のマイワークスペース	個人用のワークスペースです	cmgq17ida005aw10l4oayg7hy	2025-10-14 03:57:58.083	2025-10-14 03:57:58.083
cmgq1ujme005uw10lb1m7w6rs	多和一のマイワークスペース	個人用のワークスペースです	cmgq1ujma005sw10lwb390d1x	2025-10-14 04:15:52.791	2025-10-14 04:15:52.791
cmgq2fb8n006aw10lvegde085	折口大祐のマイワークスペース	個人用のワークスペースです	cmgq2fb8h0068w10lykjzdarl	2025-10-14 04:32:01.703	2025-10-14 04:32:01.703
cmgq2n2u30002yh0lkosi755j	小田孝博のマイワークスペース	個人用のワークスペースです	cmgq2n2tr0000yh0ln6avg3sr	2025-10-14 04:38:04.06	2025-10-14 04:38:04.06
cmgq31520000iyh0l437vfd1d	山本猛のマイワークスペース	個人用のワークスペースです	cmgq3151n000gyh0ldd4j1gw4	2025-10-14 04:49:00.12	2025-10-14 04:49:00.12
cmgq3f222000yyh0lzgfbe2rg	近藤和幸のマイワークスペース	個人用のワークスペースです	cmgq3f21u000wyh0lnhvabksk	2025-10-14 04:59:49.419	2025-10-14 04:59:49.419
cmgq3kya6001dyh0lolsn5bhl	細川咲のマイワークスペース	個人用のワークスペースです	cmgq3ky9v001byh0l3v51ldf3	2025-10-14 05:04:24.462	2025-10-14 05:04:24.462
cmgq3rzau001syh0l9tuxvk3a	桑原雅則のマイワークスペース	個人用のワークスペースです	cmgq3rzam001qyh0ljg3r1w41	2025-10-14 05:09:52.374	2025-10-14 05:09:52.374
cmgq42vgx0027yh0lr9acuhe6	藤井雄大のマイワークスペース	個人用のワークスペースです	cmgq42vgs0025yh0lsq74qqw4	2025-10-14 05:18:20.625	2025-10-14 05:18:20.625
cmgq4l6xl002myh0l6fk5ldct	GHアザレアのマイワークスペース	個人用のワークスペースです	cmgq4l6xh002kyh0lthnbgr7g	2025-10-14 05:32:35.29	2025-10-14 05:32:35.29
cmgq4mlbi0031yh0l84yn8o46	GHカメリアのマイワークスペース	個人用のワークスペースです	cmgq4mlbe002zyh0lyec0sg8q	2025-10-14 05:33:40.59	2025-10-14 05:33:40.59
cmgq4o8sr003gyh0lukukptl6	B型オークのマイワークスペース	個人用のワークスペースです	cmgq4o8sl003eyh0l3o437le2	2025-10-14 05:34:57.675	2025-10-14 05:34:57.675
cmgq51hw0003vyh0l8bdmobz6	高橋和美のマイワークスペース	個人用のワークスペースです	cmgq51hvw003tyh0l1f208ryw	2025-10-14 05:45:15.984	2025-10-14 05:45:15.984
cmgq56zpi004ayh0lit0f1pls	八木栄津子のマイワークスペース	個人用のワークスペースです	cmgq56zpb0048yh0l3mei0e40	2025-10-14 05:49:32.359	2025-10-14 05:49:32.359
cmgq5hr7q0002wu0lyatpf52f	三島美緒のマイワークスペース	個人用のワークスペースです	cmgq5hr7m0000wu0ljuk5e5lk	2025-10-14 05:57:54.566	2025-10-14 05:57:54.566
cmgq5luew000hwu0li47pcxqu	筒井高文のマイワークスペース	個人用のワークスペースです	cmgq5luet000fwu0ly0vydm7p	2025-10-14 06:01:05.337	2025-10-14 06:01:05.337
cmgq5o7jw000wwu0libyorm02	野田博嗣のマイワークスペース	個人用のワークスペースです	cmgq5o7js000uwu0lvb7wspd1	2025-10-14 06:02:55.676	2025-10-14 06:02:55.676
cmgq5r5qs001bwu0l9eye8hmm	城健太のマイワークスペース	個人用のワークスペースです	cmgq5r5qo0019wu0lid460t9i	2025-10-14 06:05:13.3	2025-10-14 06:05:13.3
cmgq5tsd0001qwu0l9o8m0nnr	岡田大樹のマイワークスペース	個人用のワークスペースです	cmgq5tscw001owu0l8dtq1az7	2025-10-14 06:07:15.924	2025-10-14 06:07:15.924
cmgqp3wx9000t2r0lcyik6xb6	不動産部ワークスペース		cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:07:01.102	2025-10-14 15:07:01.102
cmgpzz82u0001w10ln3lcpzgm	福祉部ワークスペース	主に福祉部内で活用	cmgnb3tqh0000zq0lze3ot4nh	2025-10-14 03:23:31.878	2025-10-14 06:17:49.614
cmgqp7gjt001c2r0lfqwbvygt	営業企画室	主に全体の販促を進めるチームです	cmgnbka6z0001q80l4f83jbzo	2025-10-14 15:09:46.506	2025-10-14 15:13:10.066
cmgt3yzsm0002w60lcxl674uq	テストのマイワークスペース	個人用のワークスペースです	cmgt3yzr30000w60lzyl8am2x	2025-10-16 07:38:38.135	2025-10-16 07:38:38.135
\.


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: board_lists board_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.board_lists
    ADD CONSTRAINT board_lists_pkey PRIMARY KEY (id);


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- Name: card_members card_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.card_members
    ADD CONSTRAINT card_members_pkey PRIMARY KEY (id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- Name: task_members task_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.task_members
    ADD CONSTRAINT task_members_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: card_members_cardId_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "card_members_cardId_employeeId_key" ON public.card_members USING btree ("cardId", "employeeId");


--
-- Name: employees_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "employees_employeeId_key" ON public.employees USING btree ("employeeId");


--
-- Name: employees_employeeNumber_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "employees_employeeNumber_key" ON public.employees USING btree ("employeeNumber");


--
-- Name: task_members_taskId_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "task_members_taskId_employeeId_key" ON public.task_members USING btree ("taskId", "employeeId");


--
-- Name: workspace_members_workspaceId_employeeId_key; Type: INDEX; Schema: public; Owner: u2t9d5jj58kd56
--

CREATE UNIQUE INDEX "workspace_members_workspaceId_employeeId_key" ON public.workspace_members USING btree ("workspaceId", "employeeId");


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: board_lists board_lists_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.board_lists
    ADD CONSTRAINT "board_lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: boards boards_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT "boards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: boards boards_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT "boards_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: card_members card_members_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.card_members
    ADD CONSTRAINT "card_members_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public.cards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: card_members card_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.card_members
    ADD CONSTRAINT "card_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cards cards_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT "cards_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES public.boards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cards cards_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT "cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cards cards_listId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES public.board_lists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluations evaluations_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT "evaluations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: files files_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: folders folders_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: folders folders_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.folders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payroll payroll_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT "payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_members task_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.task_members
    ADD CONSTRAINT "task_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_members task_members_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.task_members
    ADD CONSTRAINT "task_members_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workspace_members workspace_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "workspace_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workspace_members workspace_members_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspaces workspaces_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u2t9d5jj58kd56
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT "workspaces_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: u2t9d5jj58kd56
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: public; Owner: rdsadmin
--

GRANT ALL ON FUNCTION public.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO u2t9d5jj58kd56;


--
-- Name: extension_before_drop; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER extension_before_drop ON ddl_command_start
   EXECUTE FUNCTION _heroku.extension_before_drop();


ALTER EVENT TRIGGER extension_before_drop OWNER TO heroku_admin;

--
-- Name: log_create_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_create_ext ON ddl_command_end
   EXECUTE FUNCTION _heroku.create_ext();


ALTER EVENT TRIGGER log_create_ext OWNER TO heroku_admin;

--
-- Name: log_drop_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_drop_ext ON sql_drop
   EXECUTE FUNCTION _heroku.drop_ext();


ALTER EVENT TRIGGER log_drop_ext OWNER TO heroku_admin;

--
-- Name: validate_extension; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER validate_extension ON ddl_command_end
   EXECUTE FUNCTION _heroku.validate_extension();


ALTER EVENT TRIGGER validate_extension OWNER TO heroku_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict t0F8IG42cxXg2i2yb9dGGfjeADvi4WylU1mUGfz31ikeC2c9vDcQjrrVejyBDSx

