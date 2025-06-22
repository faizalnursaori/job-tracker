/*
  Warnings:

  - You are about to drop the `statuses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `status_id` on the `job_applications` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "statuses_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "statuses";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_job_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "job_title" TEXT NOT NULL,
    "job_level" TEXT,
    "employment_type" TEXT,
    "salary_min" REAL,
    "salary_max" REAL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "location" TEXT,
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "job_url" TEXT,
    "job_description" TEXT,
    "requirements" TEXT,
    "applied_date" DATETIME NOT NULL,
    "response_deadline" DATETIME,
    "personal_notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_job_applications" ("applied_date", "company_id", "created_at", "currency", "employment_type", "id", "is_favorite", "is_remote", "job_description", "job_level", "job_title", "job_url", "location", "personal_notes", "priority", "requirements", "response_deadline", "salary_max", "salary_min", "source", "updated_at", "user_id") SELECT "applied_date", "company_id", "created_at", "currency", "employment_type", "id", "is_favorite", "is_remote", "job_description", "job_level", "job_title", "job_url", "location", "personal_notes", "priority", "requirements", "response_deadline", "salary_max", "salary_min", "source", "updated_at", "user_id" FROM "job_applications";
DROP TABLE "job_applications";
ALTER TABLE "new_job_applications" RENAME TO "job_applications";
CREATE INDEX "job_applications_user_id_idx" ON "job_applications"("user_id");
CREATE INDEX "job_applications_company_id_idx" ON "job_applications"("company_id");
CREATE INDEX "job_applications_status_idx" ON "job_applications"("status");
CREATE INDEX "job_applications_applied_date_idx" ON "job_applications"("applied_date");
CREATE INDEX "job_applications_priority_idx" ON "job_applications"("priority");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
