-- Allow all authenticated users to read support link from admin_settings
CREATE POLICY "Anyone can view support link"
ON public.admin_settings
FOR SELECT
USING (setting_key = 'support_link');