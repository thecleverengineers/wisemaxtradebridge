-- Add missing updated_at column to binary_records table
ALTER TABLE public.binary_records 
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for binary_records
DROP TRIGGER IF EXISTS update_binary_records_updated_at ON public.binary_records;
CREATE TRIGGER update_binary_records_updated_at
    BEFORE UPDATE ON public.binary_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();