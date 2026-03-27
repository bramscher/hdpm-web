import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload_web"."enum_users_role" AS ENUM('admin', 'editor', 'viewer', 'api');
  CREATE TYPE "payload_web"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload_web"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload_web"."enum_leads_property_interest" AS ENUM('owner', 'tenant', 'general');
  CREATE TABLE "payload_web"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload_web"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "payload_web"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_web"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "payload_web"."posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "payload_web"."posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "payload_web"."enum_posts_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"author" varchar,
  	"featured_image_id" integer,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "payload_web"."pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"background_image_id" integer,
  	"cta_text" varchar,
  	"cta_link" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload_web"."pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload_web"."pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"description" varchar,
  	"button_text" varchar,
  	"button_link" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload_web"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "payload_web"."enum_pages_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."market_areas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"city" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"state" varchar DEFAULT 'OR',
  	"hero_text" varchar,
  	"hero_image_id" integer,
  	"market_description" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author" varchar NOT NULL,
  	"company" varchar,
  	"text" varchar NOT NULL,
  	"rating" numeric DEFAULT 5 NOT NULL,
  	"approved" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."team_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"bio" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"photo_id" integer,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"message" varchar,
  	"property_interest" "payload_web"."enum_leads_property_interest",
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_web"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"posts_id" integer,
  	"pages_id" integer,
  	"categories_id" integer,
  	"market_areas_id" integer,
  	"testimonials_id" integer,
  	"team_members_id" integer,
  	"leads_id" integer
  );
  
  CREATE TABLE "payload_web"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_web"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_web"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_web"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_web"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_web"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."posts" ADD CONSTRAINT "posts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "payload_web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_web"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload_web"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "payload_web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload_web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."market_areas" ADD CONSTRAINT "market_areas_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload_web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."team_members" ADD CONSTRAINT "team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload_web"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_web"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload_web"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload_web"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload_web"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload_web"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload_web"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_market_areas_fk" FOREIGN KEY ("market_areas_id") REFERENCES "payload_web"."market_areas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "payload_web"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "payload_web"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "payload_web"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_web"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_web"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload_web"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload_web"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload_web"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload_web"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload_web"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload_web"."users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload_web"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload_web"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload_web"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload_web"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload_web"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "payload_web"."media" USING btree ("sizes_hero_filename");
  CREATE INDEX "posts_tags_order_idx" ON "payload_web"."posts_tags" USING btree ("_order");
  CREATE INDEX "posts_tags_parent_id_idx" ON "payload_web"."posts_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "payload_web"."posts" USING btree ("slug");
  CREATE INDEX "posts_featured_image_idx" ON "payload_web"."posts" USING btree ("featured_image_id");
  CREATE INDEX "posts_updated_at_idx" ON "payload_web"."posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "payload_web"."posts" USING btree ("created_at");
  CREATE INDEX "posts_rels_order_idx" ON "payload_web"."posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "payload_web"."posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "payload_web"."posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_categories_id_idx" ON "payload_web"."posts_rels" USING btree ("categories_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "payload_web"."pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "payload_web"."pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "payload_web"."pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_background_image_idx" ON "payload_web"."pages_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "pages_blocks_content_order_idx" ON "payload_web"."pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "payload_web"."pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "payload_web"."pages_blocks_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "payload_web"."pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "payload_web"."pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "payload_web"."pages_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload_web"."pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "payload_web"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload_web"."pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "payload_web"."categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "payload_web"."categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "payload_web"."categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "market_areas_slug_idx" ON "payload_web"."market_areas" USING btree ("slug");
  CREATE INDEX "market_areas_hero_image_idx" ON "payload_web"."market_areas" USING btree ("hero_image_id");
  CREATE INDEX "market_areas_updated_at_idx" ON "payload_web"."market_areas" USING btree ("updated_at");
  CREATE INDEX "market_areas_created_at_idx" ON "payload_web"."market_areas" USING btree ("created_at");
  CREATE INDEX "testimonials_updated_at_idx" ON "payload_web"."testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "payload_web"."testimonials" USING btree ("created_at");
  CREATE INDEX "team_members_photo_idx" ON "payload_web"."team_members" USING btree ("photo_id");
  CREATE INDEX "team_members_updated_at_idx" ON "payload_web"."team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "payload_web"."team_members" USING btree ("created_at");
  CREATE INDEX "leads_updated_at_idx" ON "payload_web"."leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "payload_web"."leads" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_web"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_web"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_web"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_web"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_market_areas_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("market_areas_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("team_members_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_web"."payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_web"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_web"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_web"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_web"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_web"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_web"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_web"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_web"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_web"."payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload_web"."users_sessions" CASCADE;
  DROP TABLE "payload_web"."users" CASCADE;
  DROP TABLE "payload_web"."media" CASCADE;
  DROP TABLE "payload_web"."posts_tags" CASCADE;
  DROP TABLE "payload_web"."posts" CASCADE;
  DROP TABLE "payload_web"."posts_rels" CASCADE;
  DROP TABLE "payload_web"."pages_blocks_hero" CASCADE;
  DROP TABLE "payload_web"."pages_blocks_content" CASCADE;
  DROP TABLE "payload_web"."pages_blocks_cta" CASCADE;
  DROP TABLE "payload_web"."pages" CASCADE;
  DROP TABLE "payload_web"."categories" CASCADE;
  DROP TABLE "payload_web"."market_areas" CASCADE;
  DROP TABLE "payload_web"."testimonials" CASCADE;
  DROP TABLE "payload_web"."team_members" CASCADE;
  DROP TABLE "payload_web"."leads" CASCADE;
  DROP TABLE "payload_web"."payload_kv" CASCADE;
  DROP TABLE "payload_web"."payload_locked_documents" CASCADE;
  DROP TABLE "payload_web"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_web"."payload_preferences" CASCADE;
  DROP TABLE "payload_web"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload_web"."payload_migrations" CASCADE;
  DROP TYPE "payload_web"."enum_users_role";
  DROP TYPE "payload_web"."enum_posts_status";
  DROP TYPE "payload_web"."enum_pages_status";
  DROP TYPE "payload_web"."enum_leads_property_interest";`)
}
