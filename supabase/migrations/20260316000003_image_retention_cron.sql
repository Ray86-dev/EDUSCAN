-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to clean up old exam images (LOPD/GDPR: 90-day retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_exam_images()
RETURNS void AS $$
DECLARE
  old_correction RECORD;
  image_path text;
BEGIN
  -- Find corrections older than 90 days that still have image URLs
  FOR old_correction IN
    SELECT id, original_image_url, original_image_urls
    FROM corrections
    WHERE created_at < now() - interval '90 days'
      AND (original_image_url IS NOT NULL OR original_image_urls != '{}')
  LOOP
    -- Clear the image references (actual storage deletion requires the Storage API)
    UPDATE corrections
    SET original_image_url = NULL,
        original_image_urls = '{}'
    WHERE id = old_correction.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily cleanup at 03:00 UTC (04:00 hora canaria en invierno, 04:00 en verano)
SELECT cron.schedule(
  'cleanup-old-exam-images',
  '0 3 * * *',
  'SELECT public.cleanup_old_exam_images()'
);
