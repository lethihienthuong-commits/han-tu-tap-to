-- Bảng lưu hồ sơ người dùng và số dư Credits thật
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  credits integer default 25 check (credits >= 0),
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Kích hoạt Row Level Security (RLS) để bảo vệ dữ liệu
alter table public.profiles enable row level security;

-- Cho phép người dùng xem hồ sơ của chính mình
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Cho phép người dùng cập nhật thông tin cá nhân (trừ việc tự nâng credits)
create policy "Users can update own profile name/avatar"
  on public.profiles for update
  using (auth.uid() = id);

-- Tự động tạo hồ sơ profile và tặng 25 credits khi người dùng đăng ký tài khoản mới (Google hoặc Email)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    25
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger kích hoạt hàm trên mỗi khi có user mới
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Bảng lưu lịch sử giao dịch nạp tiền qua SePAY / VietQR
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  order_code text unique,
  plan_id text not null,
  amount numeric not null,
  credits_added integer not null,
  status text default 'pending', -- 'pending', 'completed', 'failed'
  payment_method text default 'vietqr_sepay',
  sepay_transaction_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);
