-- supabase/migrations/20260713120000_add_music_tracks.sql
-- Migration: Add music_tracks table for admin-managed background music playlist
-- Date: 2026-07-13

create table music_tracks (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table music_tracks enable row level security;

create policy "music_tracks_public_read" on music_tracks for select using (true);
create policy "music_tracks_admin_insert" on music_tracks for insert with check (auth.role() = 'authenticated');
create policy "music_tracks_admin_delete" on music_tracks for delete using (auth.role() = 'authenticated');
