-- Drop existing storage policies for deposit-qr-codes
DROP POLICY IF EXISTS "Admins can upload QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete QR codes" ON storage.objects;

-- Recreate storage policies with super-admin role included
CREATE POLICY "Admins can upload QR codes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deposit-qr-codes' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'superadmin'::app_role) OR
    has_role(auth.uid(), 'super-admin'::app_role)
  )
);

CREATE POLICY "Admins can update QR codes"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'deposit-qr-codes' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'superadmin'::app_role) OR
    has_role(auth.uid(), 'super-admin'::app_role)
  )
);

CREATE POLICY "Admins can delete QR codes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'deposit-qr-codes' AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'superadmin'::app_role) OR
    has_role(auth.uid(), 'super-admin'::app_role)
  )
);