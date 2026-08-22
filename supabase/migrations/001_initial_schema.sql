-- Lost & Found Matcher Database Schema
-- Run this in your Supabase SQL Editor

-- Create enum for item categories
CREATE TYPE item_category AS ENUM (
  'electronics',
  'clothing', 
  'accessories',
  'bags',
  'documents',
  'keys',
  'other'
);

-- Lost items table
CREATE TABLE lost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category item_category NOT NULL,
  color TEXT,
  brand TEXT,
  location TEXT NOT NULL,
  date_lost TIMESTAMPTZ NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Found items table
CREATE TABLE found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category item_category NOT NULL,
  color TEXT,
  brand TEXT,
  location_found TEXT NOT NULL,
  date_found TIMESTAMPTZ NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX idx_lost_items_category ON lost_items(category);
CREATE INDEX idx_lost_items_location ON lost_items(location);
CREATE INDEX idx_lost_items_date_lost ON lost_items(date_lost);

CREATE INDEX idx_found_items_category ON found_items(category);
CREATE INDEX idx_found_items_location_found ON found_items(location_found);
CREATE INDEX idx_found_items_date_found ON found_items(date_found);

-- Enable Row Level Security (RLS)
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;

-- Policies for public access (adjust based on your auth requirements)
CREATE POLICY "Allow public read access on lost_items" ON lost_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on lost_items" ON lost_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on found_items" ON found_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on found_items" ON found_items
  FOR INSERT WITH CHECK (true);