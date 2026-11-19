-- ============================================================================
-- توصيلـة السنتر — Database Schema & Row Level Security (PostgreSQL / Supabase)
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. جدول المشرفين (الأدمن) المرتبط بحسابات Supabase Auth
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- دالة مساعدة آمنة للتحقق من صلاحية الأدمن
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

-- 2. جدول عروض الترحيل (أصحاب العربات / الكباتن)
create table if not exists public.ride_offers (
  id uuid primary key default gen_random_uuid(),
  driver_name text not null check (char_length(trim(driver_name)) >= 2),
  whatsapp_number text not null check (char_length(trim(whatsapp_number)) >= 7),
  phone_number text,
  vehicle_type text not null check (char_length(trim(vehicle_type)) >= 2),
  start_area text not null check (char_length(trim(start_area)) >= 2),
  destination_area text not null check (char_length(trim(destination_area)) >= 2),
  intermediate_stops text[] not null default '{}',
  departure_time timestamptz not null,
  recurrence_type text not null default 'once' check (recurrence_type in ('once', 'daily', 'weekdays')),
  recurrence_days text[] not null default '{}',
  recurrence_group_id uuid,
  total_seats int not null check (total_seats between 1 and 50),
  available_seats int not null check (available_seats between 0 and 50),
  price_per_seat numeric(10, 2) not null default 0 check (price_per_seat >= 0),
  status text not null default 'active' check (status in ('active', 'full', 'closed')),
  expires_at timestamptz not null,
  manage_token text not null default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now(),
  constraint valid_seat_capacity check (available_seats <= total_seats)
);

-- 3. جدول طلبات الترحيل (الطلاب الباحثون عن وسيلة نقل)
create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  passenger_name text not null check (char_length(trim(passenger_name)) >= 2),
  whatsapp_number text not null check (char_length(trim(whatsapp_number)) >= 7),
  phone_number text,
  start_area text not null check (char_length(trim(start_area)) >= 2),
  destination_area text not null check (char_length(trim(destination_area)) >= 2),
  preferred_time timestamptz not null,
  seats_needed int not null default 1 check (seats_needed between 1 and 20),
  notes text,
  status text not null default 'active' check (status in ('active', 'closed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 4. جدول البلاغات (لمراجعة المحتوى المخالف أو المسيء من قِبل الأدمن)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('offer', 'request')),
  offer_id uuid references public.ride_offers(id) on delete cascade,
  request_id uuid references public.ride_requests(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 2),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint valid_report_target check (
    (target_type = 'offer' and offer_id is not null and request_id is null)
    or
    (target_type = 'request' and request_id is not null and offer_id is null)
  )
);

-- فهارس لتحسين سرعة البحث والترتيب (أقرب موعد مغادرة ثم الأحدث نشراً)
create index if not exists idx_ride_offers_upcoming_newest
  on public.ride_offers (departure_time asc, created_at desc);

create index if not exists idx_ride_offers_active_expiry
  on public.ride_offers (status, expires_at);

create index if not exists idx_ride_requests_upcoming_newest
  on public.ride_requests (preferred_time asc, created_at desc);

create index if not exists idx_reports_status_created
  on public.reports (status, created_at desc);

-- ============================================================================
-- تفعيل Row Level Security (RLS) على جميع الجداول
-- ============================================================================
alter table public.admin_users enable row level security;
alter table public.ride_offers enable row level security;
alter table public.ride_requests enable row level security;
alter table public.reports enable row level security;

-- سياسات جدول admin_users: يسمح للمشرف المسجل بقراءة سجله فقط
drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- سياسات جدول ride_offers:
-- 1) القراءة العامة: العروض غير المنتهية والنشطة أو المكتملة فقط، أو كل العروض للأدمن
drop policy if exists "ride_offers_public_read_active" on public.ride_offers;
create policy "ride_offers_public_read_active"
  on public.ride_offers
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or (
      expires_at > now()
      and status in ('active', 'full')
    )
  );

-- 2) الإضافة العامة: نشر إعلان جديد دون تسجيل دخول مع التحقق من سلامة الحقول
drop policy if exists "ride_offers_public_insert" on public.ride_offers;
create policy "ride_offers_public_insert"
  on public.ride_offers
  for insert
  to anon, authenticated
  with check (
    status = 'active'
    and available_seats between 0 and total_seats
    and expires_at > now()
  );

-- 3) التعديل والحذف: للأدمن فقط عبر RLS (وتحديث المقاعد/الإغلاق لصاحب الإعلان يتم عبر دالة RPC محمية بالرمز)
drop policy if exists "ride_offers_admin_update" on public.ride_offers;
create policy "ride_offers_admin_update"
  on public.ride_offers
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "ride_offers_admin_delete" on public.ride_offers;
create policy "ride_offers_admin_delete"
  on public.ride_offers
  for delete
  to authenticated
  using (public.is_admin());

-- سياسات جدول ride_requests:
-- 1) القراءة العامة: الطلبات النشطة غير المنتهية، أو كل الطلبات للأدمن
drop policy if exists "ride_requests_public_read_active" on public.ride_requests;
create policy "ride_requests_public_read_active"
  on public.ride_requests
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or (
      expires_at > now()
      and status = 'active'
    )
  );

-- 2) الإضافة العامة: نشر طلب ترحيل جديد دون تسجيل دخول
drop policy if exists "ride_requests_public_insert" on public.ride_requests;
create policy "ride_requests_public_insert"
  on public.ride_requests
  for insert
  to anon, authenticated
  with check (
    status = 'active'
    and expires_at > now()
  );

-- 3) التعديل والحذف: للأدمن فقط
drop policy if exists "ride_requests_admin_update" on public.ride_requests;
create policy "ride_requests_admin_update"
  on public.ride_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "ride_requests_admin_delete" on public.ride_requests;
create policy "ride_requests_admin_delete"
  on public.ride_requests
  for delete
  to authenticated
  using (public.is_admin());

-- سياسات جدول reports:
-- 1) أي زائر يمكنه إرسال بلاغ بحالة pending
drop policy if exists "reports_public_insert" on public.reports;
create policy "reports_public_insert"
  on public.reports
  for insert
  to anon, authenticated
  with check (status = 'pending');

-- 2) قراءة وتحديث وحذف البلاغات للأدمن فقط
drop policy if exists "reports_admin_select" on public.reports;
create policy "reports_admin_select"
  on public.reports
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update"
  on public.reports
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reports_admin_delete" on public.reports;
create policy "reports_admin_delete"
  on public.reports
  for delete
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- دوال آمنة (RPC) لتحديث المقاعد/الحالة بواسطة الكابتن وحذف المنتهي بواسطة الأدمن
-- ============================================================================

-- تحديث عدد المقاعد المتاحة أو تعليم الرحلة كمكتملة أو إغلاق الإعلان عبر رمز الإدارة الخاص بالإعلان
create or replace function public.driver_manage_offer(
  p_offer_id uuid,
  p_manage_token text,
  p_available_seats int,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_seats int;
  v_next_status text;
  v_next_seats int;
begin
  if p_status not in ('active', 'full', 'closed') then
    return false;
  end if;

  select total_seats
  into v_total_seats
  from public.ride_offers
  where id = p_offer_id
    and manage_token = trim(p_manage_token);

  if not found then
    return false;
  end if;

  v_next_seats := greatest(0, least(p_available_seats, v_total_seats));

  if p_status = 'closed' then
    v_next_status := 'closed';
  elsif v_next_seats = 0 or p_status = 'full' then
    v_next_status := 'full';
    if p_status = 'full' and p_available_seats > 0 then
      v_next_seats := 0;
    end if;
  else
    v_next_status := 'active';
  end if;

  update public.ride_offers
  set available_seats = v_next_seats,
      status = v_next_status
  where id = p_offer_id
    and manage_token = trim(p_manage_token);

  return found;
end;
$$;

grant execute on function public.driver_manage_offer(uuid, text, int, text) to anon, authenticated;

-- حذف الإعلانات والطلبات المنتهية الصلاحية بواسطة الأدمن فقط
create or replace function public.admin_delete_expired_ads()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_offers int := 0;
  v_deleted_requests int := 0;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;

  with deleted as (
    delete from public.ride_offers
    where expires_at <= now()
    returning id
  )
  select count(*) into v_deleted_offers from deleted;

  with deleted as (
    delete from public.ride_requests
    where expires_at <= now()
    returning id
  )
  select count(*) into v_deleted_requests from deleted;

  return jsonb_build_object(
    'deleted_offers', v_deleted_offers,
    'deleted_requests', v_deleted_requests
  );
end;
$$;

grant execute on function public.admin_delete_expired_ads() to authenticated;