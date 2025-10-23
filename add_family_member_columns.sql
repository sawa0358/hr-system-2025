-- Add missing columns to family_members table
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS phone VARCHAR(255);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS living_separately BOOLEAN DEFAULT false;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS my_number VARCHAR(255);

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'family_members_employee_id_fkey'
    ) THEN
        ALTER TABLE family_members 
        ADD CONSTRAINT family_members_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
    END IF;
END $$;
