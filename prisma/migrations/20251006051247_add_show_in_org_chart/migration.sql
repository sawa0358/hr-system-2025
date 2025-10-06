-- AlterTable
ALTER TABLE "files" ADD COLUMN "folderName" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "employeeType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "team" TEXT,
    "joinDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "password" TEXT NOT NULL,
    "role" TEXT,
    "myNumber" TEXT,
    "userId" TEXT,
    "url" TEXT,
    "address" TEXT,
    "selfIntroduction" TEXT,
    "phoneInternal" TEXT,
    "phoneMobile" TEXT,
    "birthDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "showInOrgChart" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_employees" ("address", "createdAt", "department", "email", "employeeId", "employeeNumber", "employeeType", "id", "joinDate", "myNumber", "name", "organization", "password", "phone", "phoneInternal", "phoneMobile", "position", "role", "selfIntroduction", "status", "team", "updatedAt", "url", "userId") SELECT "address", "createdAt", "department", "email", "employeeId", "employeeNumber", "employeeType", "id", "joinDate", "myNumber", "name", "organization", "password", "phone", "phoneInternal", "phoneMobile", "position", "role", "selfIntroduction", "status", "team", "updatedAt", "url", "userId" FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "employees"("employeeNumber");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
