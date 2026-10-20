-- Gợi ý cấu trúc PostgreSQL/Supabase nếu sau này cần cơ sở dữ liệu lớn hơn SQLite của server/app.py.
-- Chưa được ứng dụng sử dụng; ánh xạ 1-1 với các store trong database_schema.md.

create table products (
  code        text primary key,
  "group"     text,
  name        text not null,
  pattern     text,
  size        text,
  glaze       text,
  unit        text not null,
  price       bigint check (price is null or price > 0),   -- null = Chưa có giá
  note        text,
  image_id    text,
  active      boolean not null default true,
  ord         integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table records (
  id                 text primary key,
  kind               text not null check (kind in ('template','quote')),
  name               text,
  "desc"             text,
  altar_size         text,
  image_id           text,
  items              jsonb not null default '[]',   -- dòng vật phẩm, giữ đơn giá tại thời điểm lưu
  discount           jsonb not null default '{"mode":"none","value":0}',
  shipping           bigint not null default 0 check (shipping >= 0),
  install            bigint not null default 0 check (install >= 0),
  other_fee          bigint not null default 0 check (other_fee >= 0),
  other_fee_label    text,
  note               text,
  vat_note           text,
  customer           jsonb not null default '{}',
  quote_code         text unique,
  quote_date         date,
  valid_until        date,
  compose            jsonb,
  source_template_id text references records(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table images (
  id          text primary key,
  storage_path text not null,   -- đường dẫn trong Supabase Storage
  type        text,
  w           integer,
  h           integer,
  created_at  timestamptz not null default now()
);

create table settings (
  k  text primary key,
  v  jsonb
);
