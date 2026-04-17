-- ==========================================
-- AASTMT Booking System Supabase Schema (V2)
-- Includes full RBAC, multi-purpose forms, and testing seeds
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Create Enums for stability
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'branch_manager', 'employee', 'secretary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE room_type AS ENUM ('lecture', 'multi-purpose');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE manager_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table (Maps Auth to RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    override_view_all BOOLEAN NOT NULL DEFAULT false, -- User-level override for Admins
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Delegations Table
CREATE TABLE IF NOT EXISTS public.delegations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delegator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    substitute_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- 4. Rooms Configuration
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type room_type NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    capacity INT DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Time Slots Configuration
CREATE TABLE IF NOT EXISTS public.time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_name TEXT NOT NULL UNIQUE, -- e.g. "08:00 AM - 10:00 AM"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 6. Bookings Table (Updated for Multi-Purpose Requirements)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Basic Booking Data
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL, 
    room_type room_type NOT NULL,
    date DATE NOT NULL,
    time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE SET NULL, 
    reason TEXT NOT NULL, -- Serves as Purpose of Use
    
    -- Status and Admin Response
    status booking_status NOT NULL DEFAULT 'pending',
    branch_manager_status manager_approval_status,
    branch_manager_feedback TEXT,
    admin_feedback TEXT,
    
    -- Multi-Purpose Specific Fields (Nullable for Lecture rooms)
    manager_name TEXT,
    manager_job_title TEXT,
    manager_mobile TEXT,
    mics_count INT DEFAULT 0,
    has_laptop BOOLEAN DEFAULT false,
    has_video_conf BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS branch_manager_status manager_approval_status;

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS branch_manager_feedback TEXT;

-- Ensure consistent defaults for legacy environments
UPDATE public.bookings
SET branch_manager_status = 'pending'
WHERE room_type = 'multi-purpose' AND status = 'approved' AND branch_manager_status IS NULL;

-- 7. VIP Notifications Table
CREATE TABLE IF NOT EXISTS public.vip_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Update Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read basic profiles (useful for Dropdowns)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Rooms & Slots: Viewable by everyone authenticated
CREATE POLICY "Rooms are viewable by all" 
ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Time slots are viewable by all" 
ON public.time_slots FOR SELECT USING (auth.role() = 'authenticated');

-- Bookings: User can view their own, Admin/Branch Manager can view all. 
CREATE POLICY "Users can view their own bookings or admins can view all"
ON public.bookings FOR SELECT 
USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'branch_manager') OR
    (SELECT override_view_all FROM public.profiles WHERE id = auth.uid()) = true
);

-- Bookings: Users can insert their own.
CREATE POLICY "Users can insert their own bookings"
ON public.bookings FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Bookings: Admin/Branch Manager can update.
CREATE POLICY "Admins and Branch Managers can update bookings"
ON public.bookings FOR UPDATE
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'branch_manager')
);

CREATE POLICY "Admins and Branch Managers can view VIP notifications"
ON public.vip_notifications FOR SELECT
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'branch_manager')
);

CREATE POLICY "Branch Managers can insert VIP notifications"
ON public.vip_notifications FOR INSERT
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'branch_manager'
    AND created_by = auth.uid()
);

-- ==========================================
-- TEST SEED DATA (Only run initially)
-- Note: Replace UUIDs with actual auth.users UUIDs once you sign up via the app
-- ==========================================
-- INSERT INTO public.rooms (name, type) VALUES 
-- ('Room A', 'lecture'), ('Room B', 'lecture'), ('Hall 1', 'multi-purpose');
-- INSERT INTO public.time_slots (slot_name, start_time, end_time) VALUES 
-- ('08:00 AM - 10:00 AM', '08:00', '10:00');
