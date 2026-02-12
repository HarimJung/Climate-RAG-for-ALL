-- Migration: Add 'note' column to country_data table
-- Required for: Phase 1 QA - tracking DATA_NOT_AVAILABLE entries
-- Date: 2026-02-11

ALTER TABLE public.country_data
ADD COLUMN IF NOT EXISTS note text;

COMMENT ON COLUMN public.country_data.note IS 'Tracks data availability status, e.g. DATA_NOT_AVAILABLE_WDI_2023';
