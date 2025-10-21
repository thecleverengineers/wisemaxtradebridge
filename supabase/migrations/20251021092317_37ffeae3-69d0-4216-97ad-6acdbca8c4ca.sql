-- Create storage bucket for deposit QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-qr-codes', 'deposit-qr-codes', true);

-- Allow admins to upload QR codes
CREATE POLICY "Admins can upload QR codes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deposit-qr-codes' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- Allow admins to update QR codes
CREATE POLICY "Admins can update QR codes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'deposit-qr-codes' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- Allow admins to delete QR codes
CREATE POLICY "Admins can delete QR codes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'deposit-qr-codes' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role))
);

-- Allow public access to view QR codes
CREATE POLICY "Public can view QR codes"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'deposit-qr-codes');