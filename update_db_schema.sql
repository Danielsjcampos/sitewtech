-- COMBINED MIGRATION SCRIPT FOR W-TECH
-- Run this in your Supabase SQL Editor to fix the "missing column" errors.

-- 1. Enable Quiz on Landing Pages
ALTER TABLE "public"."SITE_LandingPages" ADD COLUMN IF NOT EXISTS "quiz_enabled" boolean DEFAULT false;

-- 2. Store Quiz Results in Leads
ALTER TABLE "public"."SITE_Leads" ADD COLUMN IF NOT EXISTS "quiz_data" jsonb;

-- 3. Ensure other Lead Allocation fields exist (Required for CRM & Tracking)
ALTER TABLE "public"."SITE_Leads" ADD COLUMN IF NOT EXISTS "origin" text;
ALTER TABLE "public"."SITE_Leads" ADD COLUMN IF NOT EXISTS "assigned_to" uuid REFERENCES auth.users(id);
ALTER TABLE "public"."SITE_Leads" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}';
ALTER TABLE "public"."SITE_Leads" ADD COLUMN IF NOT EXISTS "internal_notes" text;
ALTER TABLE "public"."SITE_Leads" ADD COLUMN IF NOT EXISTS "context_id" text;

-- 4. Grant Permissions (Just in case RLS is blocking)
GRANT INSERT, SELECT, UPDATE ON TABLE "public"."SITE_LandingPages" TO authenticated;
GRANT INSERT, SELECT, UPDATE ON TABLE "public"."SITE_LandingPages" TO anon;
GRANT ALL ON TABLE "public"."SITE_Leads" TO authenticated;
GRANT INSERT ON TABLE "public"."SITE_Leads" TO anon;

-- End of Script
