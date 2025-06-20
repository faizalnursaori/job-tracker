-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "profile_image" TEXT,
    "email_verified" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "location" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "size" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
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
    CONSTRAINT "job_applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "job_applications_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_application_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "note_type" TEXT NOT NULL DEFAULT 'OTHER',
    "note_date" DATETIME NOT NULL,
    "is_important" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "application_notes_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_application_id" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "application_documents_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "application_documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_application_id" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_activities_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "job_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_name_key" ON "statuses"("name");

-- CreateIndex
CREATE INDEX "job_applications_user_id_idx" ON "job_applications"("user_id");

-- CreateIndex
CREATE INDEX "job_applications_company_id_idx" ON "job_applications"("company_id");

-- CreateIndex
CREATE INDEX "job_applications_status_id_idx" ON "job_applications"("status_id");

-- CreateIndex
CREATE INDEX "job_applications_applied_date_idx" ON "job_applications"("applied_date");

-- CreateIndex
CREATE INDEX "job_applications_priority_idx" ON "job_applications"("priority");

-- CreateIndex
CREATE INDEX "application_notes_job_application_id_idx" ON "application_notes"("job_application_id");

-- CreateIndex
CREATE INDEX "application_notes_note_date_idx" ON "application_notes"("note_date");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE INDEX "application_documents_job_application_id_idx" ON "application_documents"("job_application_id");

-- CreateIndex
CREATE INDEX "application_documents_document_type_id_idx" ON "application_documents"("document_type_id");

-- CreateIndex
CREATE INDEX "application_activities_job_application_id_idx" ON "application_activities"("job_application_id");

-- CreateIndex
CREATE INDEX "application_activities_created_at_idx" ON "application_activities"("created_at");
