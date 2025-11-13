-- Add orgChartOrder column to employees table for sibling order persistence
-- This migration applies to both SQLite and PostgreSQL

ALTER TABLE "employees" ADD COLUMN "orgChartOrder" INTEGER;


