#!/bin/bash
# Apply migration 002_add_note_column.sql to remote Supabase database
# Usage: ./scripts/apply-migration.sh <database_password>
#
# You can find the database password in:
# Supabase Dashboard > Project Settings > Database > Connection String
#
# Or run this via the Supabase Dashboard SQL Editor:
#   ALTER TABLE public.country_data ADD COLUMN IF NOT EXISTS note text;

if [ -z "$1" ]; then
  echo "Usage: $0 <database_password>"
  echo ""
  echo "Alternative: Run the following SQL in Supabase Dashboard SQL Editor:"
  echo "  ALTER TABLE public.country_data ADD COLUMN IF NOT EXISTS note text;"
  echo "  COMMENT ON COLUMN public.country_data.note IS 'Tracks data availability status';"
  exit 1
fi

DB_PASSWORD="$1"
PROJECT_REF="loiawfnakocsodxdytcu"

npx supabase db push \
  --workdir "$(dirname "$0")/.." \
  --password "$DB_PASSWORD" \
  --include-all
