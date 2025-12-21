-- AlterTable: WorkClockWorker に各パターン別源泉徴収フラグを追加
ALTER TABLE "workclock_workers" ADD COLUMN "withholdingHourlyA" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workclock_workers" ADD COLUMN "withholdingHourlyB" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workclock_workers" ADD COLUMN "withholdingHourlyC" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workclock_workers" ADD COLUMN "withholdingCountA" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workclock_workers" ADD COLUMN "withholdingCountB" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workclock_workers" ADD COLUMN "withholdingCountC" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workclock_workers" ADD COLUMN "withholdingMonthlyFixed" BOOLEAN NOT NULL DEFAULT false;

