-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "employeeType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "furigana" TEXT,
    "email" TEXT,
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
    "showInOrgChart" BOOLEAN NOT NULL DEFAULT true,
    "parentEmployeeId" TEXT,
    "isInvisibleTop" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "retirementDate" DATETIME,
    "privacyDisplayName" BOOLEAN NOT NULL DEFAULT true,
    "privacyOrganization" BOOLEAN NOT NULL DEFAULT true,
    "privacyDepartment" BOOLEAN NOT NULL DEFAULT true,
    "privacyPosition" BOOLEAN NOT NULL DEFAULT true,
    "privacyUrl" BOOLEAN NOT NULL DEFAULT true,
    "privacyAddress" BOOLEAN NOT NULL DEFAULT true,
    "privacyBio" BOOLEAN NOT NULL DEFAULT true,
    "privacyEmail" BOOLEAN NOT NULL DEFAULT true,
    "privacyWorkPhone" BOOLEAN NOT NULL DEFAULT true,
    "privacyExtension" BOOLEAN NOT NULL DEFAULT true,
    "privacyMobilePhone" BOOLEAN NOT NULL DEFAULT true,
    "privacyBirthDate" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_employees" ("address", "birthDate", "createdAt", "department", "email", "employeeId", "employeeNumber", "employeeType", "furigana", "id", "isInvisibleTop", "isSuspended", "joinDate", "myNumber", "name", "organization", "parentEmployeeId", "password", "phone", "phoneInternal", "phoneMobile", "position", "privacyAddress", "privacyBio", "privacyDepartment", "privacyDisplayName", "privacyEmail", "privacyExtension", "privacyMobilePhone", "privacyOrganization", "privacyPosition", "privacyUrl", "privacyWorkPhone", "retirementDate", "role", "selfIntroduction", "showInOrgChart", "status", "team", "updatedAt", "url", "userId") SELECT "address", "birthDate", "createdAt", "department", "email", "employeeId", "employeeNumber", "employeeType", "furigana", "id", "isInvisibleTop", "isSuspended", "joinDate", "myNumber", "name", "organization", "parentEmployeeId", "password", "phone", "phoneInternal", "phoneMobile", "position", "privacyAddress", "privacyBio", "privacyDepartment", "privacyDisplayName", "privacyEmail", "privacyExtension", "privacyMobilePhone", "privacyOrganization", "privacyPosition", "privacyUrl", "privacyWorkPhone", "retirementDate", "role", "selfIntroduction", "showInOrgChart", "status", "team", "updatedAt", "url", "userId" FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "employees"("employeeNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
