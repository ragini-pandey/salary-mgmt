CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract');--> statement-breakpoint
CREATE TYPE "public"."employment_status" AS ENUM('active', 'on_leave', 'terminated');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_code" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"job_title" text NOT NULL,
	"department" text,
	"country" text NOT NULL,
	"currency_code" text NOT NULL,
	"salary" bigint NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"status" "employment_status" DEFAULT 'active' NOT NULL,
	"hire_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_uq" ON "employees" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_code_uq" ON "employees" USING btree ("employee_code");--> statement-breakpoint
CREATE INDEX "employees_country_idx" ON "employees" USING btree ("country");--> statement-breakpoint
CREATE INDEX "employees_country_title_idx" ON "employees" USING btree ("country","job_title");--> statement-breakpoint
CREATE INDEX "employees_status_idx" ON "employees" USING btree ("status");