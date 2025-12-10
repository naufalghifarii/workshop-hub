-- Create role enum (per security best practices, roles stored in separate table)
CREATE TYPE public.app_role AS ENUM ('owner', 'staff', 'customer');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (secure role storage)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  UNIQUE(user_id, role)
);

-- Create workshop table
CREATE TABLE public.workshops (
  workshop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  open_hours VARCHAR(80),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle table
CREATE TABLE public.vehicles (
  vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plate_number VARCHAR(30) NOT NULL,
  brand VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  mileage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service table
CREATE TABLE public.services (
  service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sparepart table
CREATE TABLE public.spareparts (
  sparepart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package table
CREATE TABLE public.packages (
  package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package_sparepart junction table
CREATE TABLE public.package_spareparts (
  package_sparepart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.packages(package_id) ON DELETE CASCADE NOT NULL,
  sparepart_id UUID REFERENCES public.spareparts(sparepart_id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_service (parent) table
CREATE TABLE public.invoice_services (
  invoice_parent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(vehicle_id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES public.workshops(workshop_id) ON DELETE SET NULL,
  invoice_number VARCHAR(30) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_service_detail table
CREATE TABLE public.invoice_service_details (
  invoice_detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_parent_id UUID REFERENCES public.invoice_services(invoice_parent_id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.packages(package_id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(service_id) ON DELETE SET NULL,
  sparepart_id UUID REFERENCES public.spareparts(sparepart_id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  subtotal NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is staff or owner
CREATE OR REPLACE FUNCTION public.is_staff_or_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('owner', 'staff')
  )
$$;

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON public.workshops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_spareparts_updated_at BEFORE UPDATE ON public.spareparts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_invoice_services_updated_at BEFORE UPDATE ON public.invoice_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_spareparts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_service_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_staff_or_owner(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can update all profiles" ON public.profiles FOR UPDATE USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all roles" ON public.user_roles FOR SELECT USING (public.is_staff_or_owner(auth.uid()));
CREATE POLICY "Only owner can modify roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for workshops
CREATE POLICY "Anyone authenticated can view workshops" ON public.workshops FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage workshops" ON public.workshops FOR ALL USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for vehicles
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all vehicles" ON public.vehicles FOR SELECT USING (public.is_staff_or_owner(auth.uid()));
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can insert any vehicles" ON public.vehicles FOR INSERT WITH CHECK (public.is_staff_or_owner(auth.uid()));
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can manage all vehicles" ON public.vehicles FOR ALL USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for services (public read, staff write)
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage services" ON public.services FOR ALL USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for spareparts
CREATE POLICY "Anyone can view spareparts" ON public.spareparts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage spareparts" ON public.spareparts FOR ALL USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for packages
CREATE POLICY "Anyone can view packages" ON public.packages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage packages" ON public.packages FOR ALL USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for package_spareparts
CREATE POLICY "Anyone can view package_spareparts" ON public.package_spareparts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can manage package_spareparts" ON public.package_spareparts FOR ALL USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for invoice_services
CREATE POLICY "Users can view own invoices" ON public.invoice_services FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vehicles WHERE vehicle_id = invoice_services.vehicle_id AND user_id = auth.uid())
);
CREATE POLICY "Staff can view all invoices" ON public.invoice_services FOR SELECT USING (public.is_staff_or_owner(auth.uid()));
CREATE POLICY "Staff can manage invoices" ON public.invoice_services FOR ALL USING (public.is_staff_or_owner(auth.uid()));

-- RLS Policies for invoice_service_details
CREATE POLICY "Users can view own invoice details" ON public.invoice_service_details FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.invoice_services i 
    JOIN public.vehicles v ON i.vehicle_id = v.vehicle_id 
    WHERE i.invoice_parent_id = invoice_service_details.invoice_parent_id AND v.user_id = auth.uid()
  )
);
CREATE POLICY "Staff can view all invoice details" ON public.invoice_service_details FOR SELECT USING (public.is_staff_or_owner(auth.uid()));
CREATE POLICY "Staff can manage invoice details" ON public.invoice_service_details FOR ALL USING (public.is_staff_or_owner(auth.uid()));