/*
  Warnings:

  - You are about to drop the column `name` on the `board_lists` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `files` table. All the data in the column will be lost.
  - Added the required column `title` to the `board_lists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filename` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cards" ADD COLUMN "checklists" JSONB;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN "avatar" TEXT;
ALTER TABLE "employees" ADD COLUMN "configVersion" TEXT;
ALTER TABLE "employees" ADD COLUMN "description" TEXT;
ALTER TABLE "employees" ADD COLUMN "employmentType" TEXT;
ALTER TABLE "employees" ADD COLUMN "vacationPattern" TEXT;
ALTER TABLE "employees" ADD COLUMN "weeklyPattern" INTEGER;

-- AlterTable
ALTER TABLE "family_members" ADD COLUMN "address" TEXT;
ALTER TABLE "family_members" ADD COLUMN "description" TEXT;
ALTER TABLE "family_members" ADD COLUMN "myNumber" TEXT;
ALTER TABLE "family_members" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "custom_folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'employee',
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_folders_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_settings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "master_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vacation_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initialGrantPeriod" INTEGER NOT NULL,
    "grantPeriod" INTEGER NOT NULL,
    "carryOverLimit" INTEGER NOT NULL,
    "validityYears" INTEGER NOT NULL,
    "minimumMandatoryDays" INTEGER NOT NULL,
    "fullTimeGrantDays" INTEGER NOT NULL,
    "partTime1DayGrant" INTEGER NOT NULL,
    "partTime2DayGrant" INTEGER NOT NULL,
    "partTime3DayGrant" INTEGER NOT NULL,
    "partTime4DayGrant" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vacation_grant_schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceYears" REAL NOT NULL,
    "fullTimeGrantDays" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "parttime_grant_schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceDays" INTEGER NOT NULL,
    "workDaysPerWeek" INTEGER NOT NULL,
    "grantDays" INTEGER NOT NULL,
    "annualMinDays" INTEGER NOT NULL,
    "annualMaxDays" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vacation_balances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "grantDate" DATETIME NOT NULL,
    "grantDays" INTEGER NOT NULL,
    "remainingDays" REAL NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vacation_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vacation_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "usedDays" REAL NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vacation_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vacation_usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "usedDays" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vacation_usage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vacation_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vacation_usage_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "vacation_balances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alert3MonthsBefore" BOOLEAN NOT NULL DEFAULT true,
    "alert3MonthsThreshold" INTEGER NOT NULL DEFAULT 5,
    "alert2MonthsBefore" BOOLEAN NOT NULL DEFAULT true,
    "alert2MonthsThreshold" INTEGER NOT NULL DEFAULT 3,
    "alert1MonthBefore" BOOLEAN NOT NULL DEFAULT true,
    "alert1MonthThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "grant_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "grantDate" DATETIME NOT NULL,
    "daysGranted" DECIMAL NOT NULL,
    "daysRemaining" DECIMAL NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "configVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "grant_lots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consumptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "daysUsed" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consumptions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consumptions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "time_off_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consumptions_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "grant_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "time_off_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "unit" TEXT NOT NULL,
    "hoursPerDay" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "totalDays" DECIMAL,
    "breakdownJson" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "time_off_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "referenceDate" DATETIME NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vacation_app_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_board_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "board_lists_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_board_lists" ("boardId", "createdAt", "id", "position", "updatedAt") SELECT "boardId", "createdAt", "id", "position", "updatedAt" FROM "board_lists";
DROP TABLE "board_lists";
ALTER TABLE "new_board_lists" RENAME TO "board_lists";
CREATE TABLE "new_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT,
    "s3Key" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "folderName" TEXT,
    "taskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "files_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_files" ("category", "createdAt", "employeeId", "filePath", "fileSize", "folderName", "id", "mimeType", "originalName", "s3Key", "taskId") SELECT "category", "createdAt", "employeeId", "filePath", "fileSize", "folderName", "id", "mimeType", "originalName", "s3Key", "taskId" FROM "files";
DROP TABLE "files";
ALTER TABLE "new_files" RENAME TO "files";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_employeeId_key_key" ON "user_settings"("employeeId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_type_value_key" ON "master_data"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "parttime_grant_schedule_serviceDays_workDaysPerWeek_key" ON "parttime_grant_schedule"("serviceDays", "workDaysPerWeek");

-- CreateIndex
CREATE INDEX "vacation_balances_employeeId_grantDate_idx" ON "vacation_balances"("employeeId", "grantDate");

-- CreateIndex
CREATE UNIQUE INDEX "grant_lots_dedupKey_key" ON "grant_lots"("dedupKey");

-- CreateIndex
CREATE INDEX "grant_lots_employeeId_grantDate_idx" ON "grant_lots"("employeeId", "grantDate");

-- CreateIndex
CREATE INDEX "consumptions_employeeId_date_idx" ON "consumptions"("employeeId", "date");

-- CreateIndex
CREATE INDEX "consumptions_lotId_idx" ON "consumptions"("lotId");

-- CreateIndex
CREATE INDEX "consumptions_requestId_idx" ON "consumptions"("requestId");

-- CreateIndex
CREATE INDEX "time_off_requests_employeeId_idx" ON "time_off_requests"("employeeId");

-- CreateIndex
CREATE INDEX "alert_events_employeeId_idx" ON "alert_events"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_events_employeeId_kind_referenceDate_key" ON "alert_events"("employeeId", "kind", "referenceDate");

-- CreateIndex
CREATE INDEX "audit_logs_employeeId_idx" ON "audit_logs"("employeeId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "vacation_app_configs_version_key" ON "vacation_app_configs"("version");
