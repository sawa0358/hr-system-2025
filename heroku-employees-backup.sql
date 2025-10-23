--
-- PostgreSQL database dump
--

\restrict BzajR6ZSOXCqAY9xzm3QLSkyizHjAjabxLb8HDxVVvgBKhtr6rvGjfLt4EKuH1i

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-2.pgdg24.04+1)

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
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: u2t9d5jj58kd56
--

COPY public.employees (id, "employeeId", "employeeNumber", "employeeType", name, furigana, email, phone, department, "position", organization, team, "joinDate", status, password, role, "myNumber", "userId", url, address, "selfIntroduction", "phoneInternal", "phoneMobile", "birthDate", "createdAt", "updatedAt", "showInOrgChart", "parentEmployeeId", "isInvisibleTop", "isSuspended", "retirementDate", "privacyDisplayName", "privacyOrganization", "privacyDepartment", "privacyPosition", "privacyUrl", "privacyAddress", "privacyBio", "privacyEmail", "privacyWorkPhone", "privacyExtension", "privacyMobilePhone", "privacyBirthDate", "orgChartLabel") FROM stdin;
cmh368bfd0000sg0lp9bcbuj7	EMP-TOP-000	000	employee	見えないTOP	\N	invisible-top@company.com		経営	未設定	株式会社テックイノベーション	\N	2020-01-01 00:00:00	active	invisible-top-secure-password-2024	admin	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-23 08:39:34.106	2025-10-23 08:39:34.106	t	\N	t	f	\N	t	t	t	t	t	t	t	t	t	t	t	f	\N
\.


--
-- PostgreSQL database dump complete
--

\unrestrict BzajR6ZSOXCqAY9xzm3QLSkyizHjAjabxLb8HDxVVvgBKhtr6rvGjfLt4EKuH1i

