--
-- PostgreSQL database dump
--

\restrict clK1L2ZfobBOVlocwrYfpIes2eJZEUVtUVEDnZT9PJ9fWJ0v8noOtKNNsUo9qGE

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "public";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."EmployeeStatus" AS ENUM (
    'active',
    'leave',
    'retired',
    'suspended',
    'copy'
);


--
-- Name: EmploymentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."EmploymentType" AS ENUM (
    'FULL_TIME',
    'PART_TIME'
);


--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: RequestUnit; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."RequestUnit" AS ENUM (
    'DAY',
    'HOUR'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."UserRole" AS ENUM (
    'viewer',
    'general',
    'sub_manager',
    'store_manager',
    'manager',
    'hr',
    'admin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."activity_logs" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "userName" "text" NOT NULL,
    "action" "text" NOT NULL,
    "module" "text" NOT NULL,
    "details" "text" NOT NULL,
    "metadata" "jsonb",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: alert_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."alert_events" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "kind" "text" NOT NULL,
    "referenceDate" timestamp(3) without time zone NOT NULL,
    "details" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: alert_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."alert_settings" (
    "id" "text" NOT NULL,
    "alert3MonthsBefore" boolean DEFAULT true NOT NULL,
    "alert3MonthsThreshold" integer DEFAULT 5 NOT NULL,
    "alert2MonthsBefore" boolean DEFAULT true NOT NULL,
    "alert2MonthsThreshold" integer DEFAULT 3 NOT NULL,
    "alert1MonthBefore" boolean DEFAULT true NOT NULL,
    "alert1MonthThreshold" integer DEFAULT 5 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."attendance" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "date" timestamp(3) without time zone NOT NULL,
    "clockIn" timestamp(3) without time zone,
    "clockOut" timestamp(3) without time zone,
    "breakStart" timestamp(3) without time zone,
    "breakEnd" timestamp(3) without time zone,
    "status" "text" DEFAULT 'present'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."audit_logs" (
    "id" "text" NOT NULL,
    "employeeId" "text",
    "actor" "text" NOT NULL,
    "action" "text" NOT NULL,
    "entity" "text" NOT NULL,
    "payload" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: board_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."board_lists" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "position" integer NOT NULL,
    "boardId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."boards" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "workspaceId" "text" NOT NULL,
    "createdBy" "text",
    "position" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: card_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."card_members" (
    "id" "text" NOT NULL,
    "cardId" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."cards" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "position" integer NOT NULL,
    "listId" "text" NOT NULL,
    "boardId" "text" NOT NULL,
    "createdBy" "text",
    "attachments" "jsonb",
    "labels" "jsonb",
    "checklists" "jsonb",
    "dueDate" timestamp(3) without time zone,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'todo'::"text" NOT NULL,
    "cardColor" "text",
    "isArchived" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: consumptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."consumptions" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "requestId" "text" NOT NULL,
    "lotId" "text" NOT NULL,
    "date" timestamp(3) without time zone NOT NULL,
    "daysUsed" numeric(65,30) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: custom_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."custom_folders" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "category" "text" DEFAULT 'employee'::"text" NOT NULL,
    "name" "text" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."employees" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "employeeNumber" "text" NOT NULL,
    "employeeType" "text" NOT NULL,
    "name" "text" NOT NULL,
    "furigana" "text",
    "email" "text",
    "phone" "text",
    "department" "text" NOT NULL,
    "position" "text" NOT NULL,
    "organization" "text" NOT NULL,
    "team" "text",
    "joinDate" timestamp(3) without time zone NOT NULL,
    "status" "public"."EmployeeStatus" DEFAULT 'active'::"public"."EmployeeStatus" NOT NULL,
    "password" "text" NOT NULL,
    "role" "public"."UserRole",
    "myNumber" "text",
    "userId" "text",
    "url" "text",
    "address" "text",
    "selfIntroduction" "text",
    "phoneInternal" "text",
    "phoneMobile" "text",
    "birthDate" timestamp(3) without time zone,
    "avatar" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "showInOrgChart" boolean DEFAULT true NOT NULL,
    "parentEmployeeId" "text",
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
    "orgChartLabel" "text",
    "description" "text",
    "configVersion" "text",
    "employmentType" "public"."EmploymentType",
    "vacationPattern" "text",
    "weeklyPattern" integer
);


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."evaluations" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "period" "text" NOT NULL,
    "evaluator" "text" NOT NULL,
    "status" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: family_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."family_members" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "relationship" "text" NOT NULL,
    "birthDate" timestamp(3) without time zone,
    "phone" "text",
    "address" "text",
    "myNumber" "text",
    "description" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."files" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "originalName" "text" NOT NULL,
    "filename" "text" NOT NULL,
    "filePath" "text",
    "s3Key" "text",
    "mimeType" "text" NOT NULL,
    "fileSize" integer NOT NULL,
    "category" "text" NOT NULL,
    "folderName" "text",
    "taskId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."folders" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "parentId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: grant_lots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."grant_lots" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "grantDate" timestamp(3) without time zone NOT NULL,
    "daysGranted" numeric(65,30) NOT NULL,
    "daysRemaining" numeric(65,30) NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "dedupKey" "text" NOT NULL,
    "configVersion" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: leave_history_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."leave_history_snapshots" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "snapshotDate" timestamp(3) without time zone NOT NULL,
    "grantYear" integer NOT NULL,
    "grantDate" timestamp(3) without time zone NOT NULL,
    "totalGranted" numeric NOT NULL,
    "used" numeric NOT NULL,
    "pending" numeric NOT NULL,
    "remaining" numeric NOT NULL,
    "joinDate" timestamp(3) without time zone NOT NULL,
    "imageUrl" "text",
    "pdfUrl" "text",
    "fileFormat" "text" DEFAULT 'png'::"text" NOT NULL,
    "snapshotData" "jsonb",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."leave_requests" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "type" "text" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: master_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."master_data" (
    "id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" "text" NOT NULL,
    "label" "text" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: parttime_grant_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."parttime_grant_schedule" (
    "id" "text" NOT NULL,
    "serviceDays" integer NOT NULL,
    "workDaysPerWeek" integer NOT NULL,
    "grantDays" integer NOT NULL,
    "annualMinDays" integer NOT NULL,
    "annualMaxDays" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: payroll; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."payroll" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "period" "text" NOT NULL,
    "amount" double precision NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: task_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."task_members" (
    "id" "text" NOT NULL,
    "taskId" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."tasks" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "employeeId" "text" NOT NULL
);


--
-- Name: time_off_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."time_off_requests" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "unit" "public"."RequestUnit" NOT NULL,
    "hoursPerDay" integer,
    "status" "public"."RequestStatus" DEFAULT 'PENDING'::"public"."RequestStatus" NOT NULL,
    "approvedAt" timestamp(3) without time zone,
    "totalDays" numeric(65,30),
    "breakdownJson" "text",
    "reason" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvedBy" "text",
    "finalizedBy" "text",
    "supervisorId" "text"
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."user_settings" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vacation_app_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vacation_app_configs" (
    "id" "text" NOT NULL,
    "version" "text" NOT NULL,
    "configJson" "text" NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vacation_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vacation_balances" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "grantDate" timestamp(3) without time zone NOT NULL,
    "grantDays" integer NOT NULL,
    "remainingDays" double precision NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    "isExpired" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vacation_grant_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vacation_grant_schedule" (
    "id" "text" NOT NULL,
    "serviceYears" double precision NOT NULL,
    "fullTimeGrantDays" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vacation_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vacation_requests" (
    "id" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "usedDays" double precision NOT NULL,
    "reason" "text",
    "status" "public"."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: vacation_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vacation_settings" (
    "id" "text" NOT NULL,
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


--
-- Name: vacation_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."vacation_usage" (
    "id" "text" NOT NULL,
    "requestId" "text" NOT NULL,
    "balanceId" "text" NOT NULL,
    "usedDays" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."workspace_members" (
    "id" "text" NOT NULL,
    "workspaceId" "text" NOT NULL,
    "employeeId" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."workspaces" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "createdBy" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");


--
-- Name: alert_events alert_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."alert_events"
    ADD CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id");


--
-- Name: alert_settings alert_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."alert_settings"
    ADD CONSTRAINT "alert_settings_pkey" PRIMARY KEY ("id");


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");


--
-- Name: board_lists board_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."board_lists"
    ADD CONSTRAINT "board_lists_pkey" PRIMARY KEY ("id");


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_pkey" PRIMARY KEY ("id");


--
-- Name: card_members card_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."card_members"
    ADD CONSTRAINT "card_members_pkey" PRIMARY KEY ("id");


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");


--
-- Name: consumptions consumptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."consumptions"
    ADD CONSTRAINT "consumptions_pkey" PRIMARY KEY ("id");


--
-- Name: custom_folders custom_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."custom_folders"
    ADD CONSTRAINT "custom_folders_pkey" PRIMARY KEY ("id");


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id");


--
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."family_members"
    ADD CONSTRAINT "family_members_pkey" PRIMARY KEY ("id");


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_pkey" PRIMARY KEY ("id");


--
-- Name: grant_lots grant_lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."grant_lots"
    ADD CONSTRAINT "grant_lots_pkey" PRIMARY KEY ("id");


--
-- Name: leave_history_snapshots leave_history_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."leave_history_snapshots"
    ADD CONSTRAINT "leave_history_snapshots_pkey" PRIMARY KEY ("id");


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id");


--
-- Name: master_data master_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."master_data"
    ADD CONSTRAINT "master_data_pkey" PRIMARY KEY ("id");


--
-- Name: parttime_grant_schedule parttime_grant_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."parttime_grant_schedule"
    ADD CONSTRAINT "parttime_grant_schedule_pkey" PRIMARY KEY ("id");


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");


--
-- Name: task_members task_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."task_members"
    ADD CONSTRAINT "task_members_pkey" PRIMARY KEY ("id");


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");


--
-- Name: time_off_requests time_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id");


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");


--
-- Name: vacation_app_configs vacation_app_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_app_configs"
    ADD CONSTRAINT "vacation_app_configs_pkey" PRIMARY KEY ("id");


--
-- Name: vacation_balances vacation_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_balances"
    ADD CONSTRAINT "vacation_balances_pkey" PRIMARY KEY ("id");


--
-- Name: vacation_grant_schedule vacation_grant_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_grant_schedule"
    ADD CONSTRAINT "vacation_grant_schedule_pkey" PRIMARY KEY ("id");


--
-- Name: vacation_requests vacation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_requests"
    ADD CONSTRAINT "vacation_requests_pkey" PRIMARY KEY ("id");


--
-- Name: vacation_settings vacation_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_settings"
    ADD CONSTRAINT "vacation_settings_pkey" PRIMARY KEY ("id");


--
-- Name: vacation_usage vacation_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_usage"
    ADD CONSTRAINT "vacation_usage_pkey" PRIMARY KEY ("id");


--
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");


--
-- Name: alert_events_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "alert_events_employeeId_idx" ON "public"."alert_events" USING "btree" ("employeeId");


--
-- Name: alert_events_employeeId_kind_referenceDate_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "alert_events_employeeId_kind_referenceDate_key" ON "public"."alert_events" USING "btree" ("employeeId", "kind", "referenceDate");


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs" USING "btree" ("action");


--
-- Name: audit_logs_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_employeeId_idx" ON "public"."audit_logs" USING "btree" ("employeeId");


--
-- Name: card_members_cardId_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "card_members_cardId_employeeId_key" ON "public"."card_members" USING "btree" ("cardId", "employeeId");


--
-- Name: consumptions_employeeId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "consumptions_employeeId_date_idx" ON "public"."consumptions" USING "btree" ("employeeId", "date");


--
-- Name: consumptions_lotId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "consumptions_lotId_idx" ON "public"."consumptions" USING "btree" ("lotId");


--
-- Name: consumptions_requestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "consumptions_requestId_idx" ON "public"."consumptions" USING "btree" ("requestId");


--
-- Name: employees_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employees_employeeId_key" ON "public"."employees" USING "btree" ("employeeId");


--
-- Name: employees_employeeNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "public"."employees" USING "btree" ("employeeNumber");


--
-- Name: grant_lots_dedupKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "grant_lots_dedupKey_key" ON "public"."grant_lots" USING "btree" ("dedupKey");


--
-- Name: grant_lots_employeeId_grantDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "grant_lots_employeeId_grantDate_idx" ON "public"."grant_lots" USING "btree" ("employeeId", "grantDate");


--
-- Name: leave_history_snapshots_employeeId_grantYear_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "leave_history_snapshots_employeeId_grantYear_idx" ON "public"."leave_history_snapshots" USING "btree" ("employeeId", "grantYear");


--
-- Name: leave_history_snapshots_employeeId_snapshotDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "leave_history_snapshots_employeeId_snapshotDate_idx" ON "public"."leave_history_snapshots" USING "btree" ("employeeId", "snapshotDate");


--
-- Name: master_data_type_value_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "master_data_type_value_key" ON "public"."master_data" USING "btree" ("type", "value");


--
-- Name: parttime_grant_schedule_serviceDays_workDaysPerWeek_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "parttime_grant_schedule_serviceDays_workDaysPerWeek_key" ON "public"."parttime_grant_schedule" USING "btree" ("serviceDays", "workDaysPerWeek");


--
-- Name: task_members_taskId_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "task_members_taskId_employeeId_key" ON "public"."task_members" USING "btree" ("taskId", "employeeId");


--
-- Name: time_off_requests_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "time_off_requests_employeeId_idx" ON "public"."time_off_requests" USING "btree" ("employeeId");


--
-- Name: time_off_requests_supervisorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "time_off_requests_supervisorId_idx" ON "public"."time_off_requests" USING "btree" ("supervisorId");


--
-- Name: user_settings_employeeId_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_settings_employeeId_key_key" ON "public"."user_settings" USING "btree" ("employeeId", "key");


--
-- Name: vacation_app_configs_version_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "vacation_app_configs_version_key" ON "public"."vacation_app_configs" USING "btree" ("version");


--
-- Name: vacation_balances_employeeId_grantDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "vacation_balances_employeeId_grantDate_idx" ON "public"."vacation_balances" USING "btree" ("employeeId", "grantDate");


--
-- Name: workspace_members_workspaceId_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "workspace_members_workspaceId_employeeId_key" ON "public"."workspace_members" USING "btree" ("workspaceId", "employeeId");


--
-- Name: activity_logs activity_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alert_events alert_events_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."alert_events"
    ADD CONSTRAINT "alert_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendance attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: board_lists board_lists_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."board_lists"
    ADD CONSTRAINT "board_lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."boards"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: boards boards_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: boards boards_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: card_members card_members_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."card_members"
    ADD CONSTRAINT "card_members_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."cards"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: card_members card_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."card_members"
    ADD CONSTRAINT "card_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cards cards_boardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "public"."boards"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cards cards_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cards cards_listId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_listId_fkey" FOREIGN KEY ("listId") REFERENCES "public"."board_lists"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consumptions consumptions_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."consumptions"
    ADD CONSTRAINT "consumptions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consumptions consumptions_lotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."consumptions"
    ADD CONSTRAINT "consumptions_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."grant_lots"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: consumptions consumptions_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."consumptions"
    ADD CONSTRAINT "consumptions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."time_off_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: custom_folders custom_folders_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."custom_folders"
    ADD CONSTRAINT "custom_folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: evaluations evaluations_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: family_members family_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."family_members"
    ADD CONSTRAINT "family_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: files files_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: folders folders_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."folders"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: grant_lots grant_lots_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."grant_lots"
    ADD CONSTRAINT "grant_lots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leave_history_snapshots leave_history_snapshots_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."leave_history_snapshots"
    ADD CONSTRAINT "leave_history_snapshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."leave_requests"
    ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payroll payroll_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."payroll"
    ADD CONSTRAINT "payroll_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_members task_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."task_members"
    ADD CONSTRAINT "task_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_members task_members_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."task_members"
    ADD CONSTRAINT "task_members_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: time_off_requests time_off_requests_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."time_off_requests"
    ADD CONSTRAINT "time_off_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_settings user_settings_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vacation_balances vacation_balances_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_balances"
    ADD CONSTRAINT "vacation_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vacation_requests vacation_requests_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_requests"
    ADD CONSTRAINT "vacation_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vacation_usage vacation_usage_balanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_usage"
    ADD CONSTRAINT "vacation_usage_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "public"."vacation_balances"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vacation_usage vacation_usage_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."vacation_usage"
    ADD CONSTRAINT "vacation_usage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."vacation_requests"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: workspace_members workspace_members_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspaces workspaces_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict clK1L2ZfobBOVlocwrYfpIes2eJZEUVtUVEDnZT9PJ9fWJ0v8noOtKNNsUo9qGE

