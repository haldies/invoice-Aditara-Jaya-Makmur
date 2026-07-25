BEGIN;

-- This migration intentionally deletes all legacy application data. Supabase
-- Auth accounts remain intact because only public application tables are reset.
DROP TABLE IF EXISTS
  "cv_personal_infos",
  "cv_experiences",
  "cv_educations",
  "cv_projects",
  "app_sessions",
  "app_users",
  "job_applications",
  "cv_versions",
  "cv_data"
CASCADE;

CREATE TABLE "app_users" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "password_salt" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

CREATE TABLE "app_sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "app_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "app_sessions_token_hash_key" ON "app_sessions"("token_hash");
CREATE INDEX "app_sessions_user_id_idx" ON "app_sessions"("user_id");

CREATE TABLE "job_applications" (
  "id" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "company_name" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "location" TEXT,
  "work_location" TEXT NOT NULL DEFAULT 'onsite',
  "employment_type" TEXT NOT NULL DEFAULT 'fulltime',
  "source" TEXT,
  "job_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'wishlist',
  "status_order" INTEGER NOT NULL DEFAULT 0,
  "applied_date" TEXT,
  "follow_up_date" TEXT,
  "interview_date" TEXT,
  "offer_date" TEXT,
  "deadline_date" TEXT,
  "salary_min" DOUBLE PRECISION,
  "salary_max" DOUBLE PRECISION,
  "notes" TEXT,
  "hr_feedback" TEXT,
  "tags" TEXT NOT NULL DEFAULT '[]',
  "cv_version_id" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_applications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE
);

CREATE TABLE "cv_versions" (
  "id" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "summary" TEXT NOT NULL DEFAULT '',
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "interview_count" INTEGER NOT NULL DEFAULT 0,
  "offer_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "cv_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_versions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE
);

CREATE TABLE "cv_data" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "summary" TEXT NOT NULL DEFAULT '',
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "cv_data_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_data_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE
);

CREATE TABLE "cv_personal_infos" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "location" TEXT NOT NULL DEFAULT '',
  "linkedin" TEXT NOT NULL DEFAULT '',
  "github" TEXT NOT NULL DEFAULT '',
  "portfolio" TEXT NOT NULL DEFAULT '',
  "cv_data_id" UUID,
  "cv_version_id" TEXT,
  CONSTRAINT "cv_personal_infos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_personal_infos_cv_data_id_fkey"
    FOREIGN KEY ("cv_data_id") REFERENCES "cv_data"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cv_personal_infos_cv_version_id_fkey"
    FOREIGN KEY ("cv_version_id") REFERENCES "cv_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "cv_experiences" (
  "id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "current" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "cv_data_id" UUID,
  "cv_version_id" TEXT,
  CONSTRAINT "cv_experiences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_experiences_cv_data_id_fkey"
    FOREIGN KEY ("cv_data_id") REFERENCES "cv_data"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cv_experiences_cv_version_id_fkey"
    FOREIGN KEY ("cv_version_id") REFERENCES "cv_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "cv_educations" (
  "id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "degree" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "gpa" TEXT NOT NULL,
  "cv_data_id" UUID,
  "cv_version_id" TEXT,
  CONSTRAINT "cv_educations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_educations_cv_data_id_fkey"
    FOREIGN KEY ("cv_data_id") REFERENCES "cv_data"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cv_educations_cv_version_id_fkey"
    FOREIGN KEY ("cv_version_id") REFERENCES "cv_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "cv_projects" (
  "id" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "link" TEXT NOT NULL,
  "cv_data_id" UUID,
  "cv_version_id" TEXT,
  CONSTRAINT "cv_projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cv_projects_cv_data_id_fkey"
    FOREIGN KEY ("cv_data_id") REFERENCES "cv_data"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cv_projects_cv_version_id_fkey"
    FOREIGN KEY ("cv_version_id") REFERENCES "cv_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "job_applications_user_id_created_at_idx"
  ON "job_applications"("user_id", "created_at");
CREATE INDEX "cv_versions_user_id_created_at_idx"
  ON "cv_versions"("user_id", "created_at");
CREATE UNIQUE INDEX "cv_data_user_id_key" ON "cv_data"("user_id");
CREATE UNIQUE INDEX "cv_personal_infos_cv_data_id_key"
  ON "cv_personal_infos"("cv_data_id");
CREATE UNIQUE INDEX "cv_personal_infos_cv_version_id_key"
  ON "cv_personal_infos"("cv_version_id");

ALTER TABLE "job_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv_data" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv_personal_infos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv_experiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv_educations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cv_projects" ENABLE ROW LEVEL SECURITY;

COMMIT;
