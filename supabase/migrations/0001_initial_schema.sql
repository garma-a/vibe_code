-- 0001_initial_schema.sql
-- Create Enum for User Roles
CREATE TYPE public.user_role AS ENUM ('admin', 'branch_manager', 'employee', 'secretary');

-- Create Enum for Room Types
CREATE TYPE public.room_type AS ENUM ('lecture', 'multi_purpose');

-- Create Enum for Booking Types
CREATE TYPE public.booking_type AS ENUM ('fixed', 'exceptional', 'multi_purpose');

-- Create Enum for Booking Status
CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'rejected');

-- 1. PROFILES / USERS TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role public.user_role DEFAULT 'employee'::public.user_role NOT NULL,
    can_view_availability BOOLEAN DEFAULT false NOT NULL, -- User-Level Override
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DELEGATIONS / TEMPORARY ACCESS
CREATE TABLE public.delegations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    substitute_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_dates CHECK (start_date <= end_date)
);

-- 3. ROOMS TABLE
CREATE TABLE public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type public.room_type NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TIME SLOTS TABLE (Dynamic Configuration for standard schedule)
CREATE TABLE public.slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g. "Slot 1"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_time CHECK (start_time < end_time)
);

-- 5. BOOKINGS TABLE (Core transactional table)
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.rooms(id) ON DELETE RESTRICT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    booking_date DATE NOT NULL,
    slot_id UUID REFERENCES public.slots(id) ON DELETE RESTRICT, 
    -- Alternatively, allowing custom times for exceptional bookings
    custom_start_time TIME,
    custom_end_time TIME,
    
    booking_type public.booking_type NOT NULL,
    status public.booking_status DEFAULT 'pending'::public.booking_status NOT NULL,
    purpose TEXT NOT NULL,
    
    rejection_reason TEXT,
    suggested_alternative TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure at least slot or custom times are provided
    CONSTRAINT time_provided CHECK (slot_id IS NOT NULL OR (custom_start_time IS NOT NULL AND custom_end_time IS NOT NULL))
);

-- 6. MULTI-PURPOSE E-FORM DETAILS 
-- Specifically requested by SRD Section 5
CREATE TABLE public.multi_purpose_details (
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE PRIMARY KEY,
    event_manager_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(50) NOT NULL,
    needs_microphones BOOLEAN DEFAULT false,
    microphone_quantity INTEGER DEFAULT 0,
    needs_laptop BOOLEAN DEFAULT false,
    needs_video_conference BOOLEAN DEFAULT false
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_purpose_details ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles (needed for dropdowns), but only update their own or if admin.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Rooms/Slots: Viewable by all, managed by admins.
CREATE POLICY "Rooms viewable by everyone" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Slots viewable by everyone" ON public.slots FOR SELECT USING (true);
CREATE POLICY "Admins manage rooms" ON public.rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins manage slots" ON public.slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings: 
-- Admins/Managers can view all bookings
-- Employees/Secretaries can view their own bookings, or ALL bookings ONLY IF can_view_availability = true
CREATE POLICY "Bookings view policy" ON public.bookings FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role IN ('admin', 'branch_manager') OR can_view_availability = true))
);

-- Anyone authenticated can insert a booking
CREATE POLICY "Insert bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins and Branch Managers can update bookings (to approve/reject)
CREATE POLICY "Update bookings" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);
