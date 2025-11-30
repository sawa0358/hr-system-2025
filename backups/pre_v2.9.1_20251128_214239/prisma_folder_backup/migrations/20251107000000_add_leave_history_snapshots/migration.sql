-- CreateTable
CREATE TABLE "leave_history_snapshots" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "grantYear" INTEGER NOT NULL,
    "grantDate" TIMESTAMP(3) NOT NULL,
    "totalGranted" DECIMAL NOT NULL,
    "used" DECIMAL NOT NULL,
    "pending" DECIMAL NOT NULL,
    "remaining" DECIMAL NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "pdfUrl" TEXT,
    "fileFormat" TEXT NOT NULL DEFAULT 'png',
    "snapshotData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leave_history_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "leave_history_snapshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "leave_history_snapshots_employeeId_grantYear_idx" ON "leave_history_snapshots"("employeeId", "grantYear");

-- CreateIndex
CREATE INDEX "leave_history_snapshots_employeeId_snapshotDate_idx" ON "leave_history_snapshots"("employeeId", "snapshotDate");

