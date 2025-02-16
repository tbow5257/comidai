-- Enable citext if not already enabled
CREATE EXTENSION IF NOT EXISTS citext;

-- Create the timezone validation function
CREATE OR REPLACE FUNCTION is_timezone( tz TEXT ) 
RETURNS BOOLEAN as $$
BEGIN
  PERFORM now() AT TIME ZONE tz;
  RETURN TRUE;
EXCEPTION WHEN invalid_parameter_value THEN
  RETURN FALSE;
END;
$$ language plpgsql STABLE;

-- Create the timezone domain
CREATE DOMAIN timezone AS CITEXT
  CHECK ( is_timezone( value ) );

-- Only the ALTER statements for existing table
ALTER TABLE "meals" ALTER COLUMN "created_at" DROP DEFAULT;
ALTER TABLE "meals" ADD COLUMN "time_zone" timezone NOT NULL DEFAULT 'UTC';
-- Remove the default after migration if so it doesn't apply to new rows
ALTER TABLE "meals" ALTER COLUMN "time_zone" DROP DEFAULT;