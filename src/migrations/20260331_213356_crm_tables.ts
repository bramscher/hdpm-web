import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload_web"."enum_testimonials_source" AS ENUM('google', 'manual');
  CREATE TYPE "payload_web"."enum_leads_status" AS ENUM('new', 'attempted_contact', 'engaged', 'tour_scheduled', 'toured', 'applied', 'approved', 'leased', 'lost', 'archived');
  CREATE TYPE "payload_web"."enum_leads_preferred_language" AS ENUM('en', 'es');
  CREATE TYPE "payload_web"."enum_leads_source" AS ENUM('zillow', 'apartments_com', 'website', 'facebook', 'instagram', 'phone', 'walk_in', 'referral', 'other');
  CREATE TYPE "payload_web"."enum_leads_lead_type" AS ENUM('tenant', 'owner', 'vendor', 'other');
  CREATE TYPE "payload_web"."enum_lead_activities_type" AS ENUM('note', 'email_sent', 'email_received', 'sms_sent', 'sms_received', 'call_logged', 'voicemail', 'task_created', 'task_completed', 'status_changed', 'property_matched', 'guest_card_created');
  CREATE TYPE "payload_web"."enum_lead_activities_direction" AS ENUM('inbound', 'outbound', 'internal');
  CREATE TYPE "payload_web"."enum_lead_tasks_task_type" AS ENUM('follow_up_call', 'follow_up_sms', 'follow_up_email', 'manual_review', 'spanish_follow_up', 'appfolio_push', 'other');
  CREATE TYPE "payload_web"."enum_lead_tasks_status" AS ENUM('open', 'in_progress', 'complete', 'canceled', 'overdue');
  CREATE TYPE "payload_web"."enum_lead_tasks_priority" AS ENUM('low', 'medium', 'high', 'urgent');
  CREATE TYPE "payload_web"."enum_properties_interest_status" AS ENUM('interested', 'touring', 'applied', 'leased', 'lost');
  CREATE TYPE "payload_web"."enum_lead_conversations_channel" AS ENUM('email', 'sms', 'phone', 'web', 'social', 'internal');
  CREATE TYPE "payload_web"."enum_lead_conversations_direction" AS ENUM('inbound', 'outbound');
  CREATE TYPE "payload_web"."enum_lead_conversations_language" AS ENUM('en', 'es');
  CREATE TYPE "payload_web"."enum_automation_rules_trigger_type" AS ENUM('lead_created', 'status_changed', 'no_activity_timeout', 'task_overdue', 'follow_up_due');
  CREATE TYPE "payload_web"."enum_automation_rules_action_type" AS ENUM('create_task', 'change_status', 'send_notification', 'assign_lead');
  CREATE TABLE "payload_web"."lead_activities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"type" "payload_web"."enum_lead_activities_type" NOT NULL,
  	"direction" "payload_web"."enum_lead_activities_direction",
  	"body" varchar NOT NULL,
  	"metadata" jsonb,
  	"performed_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."lead_tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"task_type" "payload_web"."enum_lead_tasks_task_type" NOT NULL,
  	"status" "payload_web"."enum_lead_tasks_status" DEFAULT 'open',
  	"due_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone,
  	"assigned_to_id" integer NOT NULL,
  	"priority" "payload_web"."enum_lead_tasks_priority" DEFAULT 'medium',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."properties_interest" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"property_external_id" varchar,
  	"property_name" varchar,
  	"unit_identifier" varchar,
  	"address" varchar,
  	"rent" numeric,
  	"availability_date" timestamp(3) with time zone,
  	"source_url" varchar,
  	"status" "payload_web"."enum_properties_interest_status" DEFAULT 'interested',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."lead_conversations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"channel" "payload_web"."enum_lead_conversations_channel" NOT NULL,
  	"subject" varchar,
  	"body" varchar NOT NULL,
  	"direction" "payload_web"."enum_lead_conversations_direction",
  	"language" "payload_web"."enum_lead_conversations_language" DEFAULT 'en',
  	"sent_by_id" integer,
  	"latest_message_at" timestamp(3) with time zone,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."automation_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"is_active" boolean DEFAULT true,
  	"trigger_type" "payload_web"."enum_automation_rules_trigger_type" NOT NULL,
  	"conditions" jsonb,
  	"action_type" "payload_web"."enum_automation_rules_action_type" NOT NULL,
  	"action_config" jsonb,
  	"priority" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_web"."testimonials" ALTER COLUMN "approved" SET DEFAULT true;
  ALTER TABLE "payload_web"."leads" ALTER COLUMN "source" SET DATA TYPE "payload_web"."enum_leads_source" USING "source"::"payload_web"."enum_leads_source";
  ALTER TABLE "payload_web"."users" ADD COLUMN "first_name" varchar;
  ALTER TABLE "payload_web"."users" ADD COLUMN "last_name" varchar;
  ALTER TABLE "payload_web"."users" ADD COLUMN "is_assignable" boolean DEFAULT false;
  ALTER TABLE "payload_web"."users" ADD COLUMN "speaks_spanish" boolean DEFAULT false;
  ALTER TABLE "payload_web"."users" ADD COLUMN "max_leads" numeric;
  ALTER TABLE "payload_web"."posts" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "payload_web"."posts" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "payload_web"."posts" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "payload_web"."pages" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "payload_web"."pages" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "payload_web"."pages" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "payload_web"."testimonials" ADD COLUMN "source" "payload_web"."enum_testimonials_source" DEFAULT 'google';
  ALTER TABLE "payload_web"."testimonials" ADD COLUMN "google_review_id" varchar;
  ALTER TABLE "payload_web"."testimonials" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "status" "payload_web"."enum_leads_status" DEFAULT 'new';
  ALTER TABLE "payload_web"."leads" ADD COLUMN "assigned_to_id" integer;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "next_follow_up_at" timestamp(3) with time zone;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "first_name" varchar NOT NULL;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "last_name" varchar NOT NULL;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "preferred_language" "payload_web"."enum_leads_preferred_language" DEFAULT 'en';
  ALTER TABLE "payload_web"."leads" ADD COLUMN "do_not_contact" boolean DEFAULT false;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "sms_opt_in" boolean DEFAULT true;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "email_opt_in" boolean DEFAULT true;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "source_detail" varchar;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "lead_type" "payload_web"."enum_leads_lead_type";
  ALTER TABLE "payload_web"."leads" ADD COLUMN "stage_reason" varchar;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "notes_summary" varchar;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "desired_move_in_date" timestamp(3) with time zone;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "monthly_budget_min" numeric;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "monthly_budget_max" numeric;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "last_contacted_at" timestamp(3) with time zone;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "last_inbound_at" timestamp(3) with time zone;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "last_outbound_at" timestamp(3) with time zone;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "appfolio_guest_card_id" varchar;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "rentzap_application_id" varchar;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "is_duplicate_of_lead_id" numeric;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD COLUMN "lead_activities_id" integer;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD COLUMN "lead_tasks_id" integer;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD COLUMN "properties_interest_id" integer;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD COLUMN "lead_conversations_id" integer;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD COLUMN "automation_rules_id" integer;
  ALTER TABLE "payload_web"."lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "payload_web"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."lead_activities" ADD CONSTRAINT "lead_activities_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "payload_web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."lead_tasks" ADD CONSTRAINT "lead_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "payload_web"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."lead_tasks" ADD CONSTRAINT "lead_tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "payload_web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."properties_interest" ADD CONSTRAINT "properties_interest_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "payload_web"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."lead_conversations" ADD CONSTRAINT "lead_conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "payload_web"."leads"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."lead_conversations" ADD CONSTRAINT "lead_conversations_sent_by_id_users_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "payload_web"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "lead_activities_lead_idx" ON "payload_web"."lead_activities" USING btree ("lead_id");
  CREATE INDEX "lead_activities_performed_by_idx" ON "payload_web"."lead_activities" USING btree ("performed_by_id");
  CREATE INDEX "lead_activities_updated_at_idx" ON "payload_web"."lead_activities" USING btree ("updated_at");
  CREATE INDEX "lead_activities_created_at_idx" ON "payload_web"."lead_activities" USING btree ("created_at");
  CREATE INDEX "lead_tasks_lead_idx" ON "payload_web"."lead_tasks" USING btree ("lead_id");
  CREATE INDEX "lead_tasks_due_at_idx" ON "payload_web"."lead_tasks" USING btree ("due_at");
  CREATE INDEX "lead_tasks_assigned_to_idx" ON "payload_web"."lead_tasks" USING btree ("assigned_to_id");
  CREATE INDEX "lead_tasks_updated_at_idx" ON "payload_web"."lead_tasks" USING btree ("updated_at");
  CREATE INDEX "lead_tasks_created_at_idx" ON "payload_web"."lead_tasks" USING btree ("created_at");
  CREATE INDEX "properties_interest_lead_idx" ON "payload_web"."properties_interest" USING btree ("lead_id");
  CREATE INDEX "properties_interest_updated_at_idx" ON "payload_web"."properties_interest" USING btree ("updated_at");
  CREATE INDEX "properties_interest_created_at_idx" ON "payload_web"."properties_interest" USING btree ("created_at");
  CREATE INDEX "lead_conversations_lead_idx" ON "payload_web"."lead_conversations" USING btree ("lead_id");
  CREATE INDEX "lead_conversations_sent_by_idx" ON "payload_web"."lead_conversations" USING btree ("sent_by_id");
  CREATE INDEX "lead_conversations_updated_at_idx" ON "payload_web"."lead_conversations" USING btree ("updated_at");
  CREATE INDEX "lead_conversations_created_at_idx" ON "payload_web"."lead_conversations" USING btree ("created_at");
  CREATE INDEX "automation_rules_updated_at_idx" ON "payload_web"."automation_rules" USING btree ("updated_at");
  CREATE INDEX "automation_rules_created_at_idx" ON "payload_web"."automation_rules" USING btree ("created_at");
  ALTER TABLE "payload_web"."posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload_web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload_web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "payload_web"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_activities_fk" FOREIGN KEY ("lead_activities_id") REFERENCES "payload_web"."lead_activities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_tasks_fk" FOREIGN KEY ("lead_tasks_id") REFERENCES "payload_web"."lead_tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_properties_interest_fk" FOREIGN KEY ("properties_interest_id") REFERENCES "payload_web"."properties_interest"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_conversations_fk" FOREIGN KEY ("lead_conversations_id") REFERENCES "payload_web"."lead_conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_automation_rules_fk" FOREIGN KEY ("automation_rules_id") REFERENCES "payload_web"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_meta_meta_image_idx" ON "payload_web"."posts" USING btree ("meta_image_id");
  CREATE INDEX "pages_meta_meta_image_idx" ON "payload_web"."pages" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "testimonials_google_review_id_idx" ON "payload_web"."testimonials" USING btree ("google_review_id");
  CREATE INDEX "leads_status_idx" ON "payload_web"."leads" USING btree ("status");
  CREATE INDEX "leads_assigned_to_idx" ON "payload_web"."leads" USING btree ("assigned_to_id");
  CREATE INDEX "leads_next_follow_up_at_idx" ON "payload_web"."leads" USING btree ("next_follow_up_at");
  CREATE INDEX "leads_email_idx" ON "payload_web"."leads" USING btree ("email");
  CREATE INDEX "leads_phone_idx" ON "payload_web"."leads" USING btree ("phone");
  CREATE INDEX "leads_source_idx" ON "payload_web"."leads" USING btree ("source");
  CREATE INDEX "leads_lead_type_idx" ON "payload_web"."leads" USING btree ("lead_type");
  CREATE INDEX "payload_locked_documents_rels_lead_activities_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("lead_activities_id");
  CREATE INDEX "payload_locked_documents_rels_lead_tasks_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("lead_tasks_id");
  CREATE INDEX "payload_locked_documents_rels_properties_interest_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("properties_interest_id");
  CREATE INDEX "payload_locked_documents_rels_lead_conversations_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("lead_conversations_id");
  CREATE INDEX "payload_locked_documents_rels_automation_rules_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("automation_rules_id");
  ALTER TABLE "payload_web"."posts" DROP COLUMN IF EXISTS "seo_title";
  ALTER TABLE "payload_web"."posts" DROP COLUMN IF EXISTS "seo_description";
  ALTER TABLE "payload_web"."testimonials" DROP COLUMN IF EXISTS "company";
  ALTER TABLE "payload_web"."leads" DROP COLUMN IF EXISTS "name";
  ALTER TABLE "payload_web"."leads" DROP COLUMN IF EXISTS "property_interest";
  DROP TYPE IF EXISTS "payload_web"."enum_leads_property_interest";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload_web"."enum_leads_property_interest" AS ENUM('owner', 'tenant', 'general');
  ALTER TABLE "payload_web"."lead_activities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_web"."lead_tasks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_web"."properties_interest" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_web"."lead_conversations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_web"."automation_rules" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_web"."lead_activities" CASCADE;
  DROP TABLE "payload_web"."lead_tasks" CASCADE;
  DROP TABLE "payload_web"."properties_interest" CASCADE;
  DROP TABLE "payload_web"."lead_conversations" CASCADE;
  DROP TABLE "payload_web"."automation_rules" CASCADE;
  ALTER TABLE "payload_web"."posts" DROP CONSTRAINT "posts_meta_image_id_media_id_fk";
  
  ALTER TABLE "payload_web"."pages" DROP CONSTRAINT "pages_meta_image_id_media_id_fk";
  
  ALTER TABLE "payload_web"."leads" DROP CONSTRAINT "leads_assigned_to_id_users_id_fk";
  
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lead_activities_fk";
  
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lead_tasks_fk";
  
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_properties_interest_fk";
  
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lead_conversations_fk";
  
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_automation_rules_fk";
  
  DROP INDEX "payload_web"."posts_meta_meta_image_idx";
  DROP INDEX "payload_web"."pages_meta_meta_image_idx";
  DROP INDEX "payload_web"."testimonials_google_review_id_idx";
  DROP INDEX "payload_web"."leads_status_idx";
  DROP INDEX "payload_web"."leads_assigned_to_idx";
  DROP INDEX "payload_web"."leads_next_follow_up_at_idx";
  DROP INDEX "payload_web"."leads_email_idx";
  DROP INDEX "payload_web"."leads_phone_idx";
  DROP INDEX "payload_web"."leads_source_idx";
  DROP INDEX "payload_web"."leads_lead_type_idx";
  DROP INDEX "payload_web"."payload_locked_documents_rels_lead_activities_id_idx";
  DROP INDEX "payload_web"."payload_locked_documents_rels_lead_tasks_id_idx";
  DROP INDEX "payload_web"."payload_locked_documents_rels_properties_interest_id_idx";
  DROP INDEX "payload_web"."payload_locked_documents_rels_lead_conversations_id_idx";
  DROP INDEX "payload_web"."payload_locked_documents_rels_automation_rules_id_idx";
  ALTER TABLE "payload_web"."testimonials" ALTER COLUMN "approved" SET DEFAULT false;
  ALTER TABLE "payload_web"."leads" ALTER COLUMN "source" SET DATA TYPE varchar;
  ALTER TABLE "payload_web"."posts" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "payload_web"."posts" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "payload_web"."testimonials" ADD COLUMN "company" varchar;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "payload_web"."leads" ADD COLUMN "property_interest" "payload_web"."enum_leads_property_interest";
  ALTER TABLE "payload_web"."users" DROP COLUMN "first_name";
  ALTER TABLE "payload_web"."users" DROP COLUMN "last_name";
  ALTER TABLE "payload_web"."users" DROP COLUMN "is_assignable";
  ALTER TABLE "payload_web"."users" DROP COLUMN "speaks_spanish";
  ALTER TABLE "payload_web"."users" DROP COLUMN "max_leads";
  ALTER TABLE "payload_web"."posts" DROP COLUMN "meta_title";
  ALTER TABLE "payload_web"."posts" DROP COLUMN "meta_description";
  ALTER TABLE "payload_web"."posts" DROP COLUMN "meta_image_id";
  ALTER TABLE "payload_web"."pages" DROP COLUMN "meta_title";
  ALTER TABLE "payload_web"."pages" DROP COLUMN "meta_description";
  ALTER TABLE "payload_web"."pages" DROP COLUMN "meta_image_id";
  ALTER TABLE "payload_web"."testimonials" DROP COLUMN "source";
  ALTER TABLE "payload_web"."testimonials" DROP COLUMN "google_review_id";
  ALTER TABLE "payload_web"."testimonials" DROP COLUMN "published_at";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "status";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "assigned_to_id";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "next_follow_up_at";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "first_name";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "last_name";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "preferred_language";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "do_not_contact";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "sms_opt_in";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "email_opt_in";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "source_detail";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "lead_type";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "stage_reason";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "notes_summary";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "desired_move_in_date";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "monthly_budget_min";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "monthly_budget_max";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "last_contacted_at";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "last_inbound_at";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "last_outbound_at";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "appfolio_guest_card_id";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "rentzap_application_id";
  ALTER TABLE "payload_web"."leads" DROP COLUMN "is_duplicate_of_lead_id";
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP COLUMN "lead_activities_id";
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP COLUMN "lead_tasks_id";
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP COLUMN "properties_interest_id";
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP COLUMN "lead_conversations_id";
  ALTER TABLE "payload_web"."payload_locked_documents_rels" DROP COLUMN "automation_rules_id";
  DROP TYPE "payload_web"."enum_testimonials_source";
  DROP TYPE "payload_web"."enum_leads_status";
  DROP TYPE "payload_web"."enum_leads_preferred_language";
  DROP TYPE "payload_web"."enum_leads_source";
  DROP TYPE "payload_web"."enum_leads_lead_type";
  DROP TYPE "payload_web"."enum_lead_activities_type";
  DROP TYPE "payload_web"."enum_lead_activities_direction";
  DROP TYPE "payload_web"."enum_lead_tasks_task_type";
  DROP TYPE "payload_web"."enum_lead_tasks_status";
  DROP TYPE "payload_web"."enum_lead_tasks_priority";
  DROP TYPE "payload_web"."enum_properties_interest_status";
  DROP TYPE "payload_web"."enum_lead_conversations_channel";
  DROP TYPE "payload_web"."enum_lead_conversations_direction";
  DROP TYPE "payload_web"."enum_lead_conversations_language";
  DROP TYPE "payload_web"."enum_automation_rules_trigger_type";
  DROP TYPE "payload_web"."enum_automation_rules_action_type";`)
}
