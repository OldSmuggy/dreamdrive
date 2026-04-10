-- Add Australian market price comparison columns to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS au_market_price_low INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS au_market_price_high INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS au_market_source TEXT DEFAULT 'Carsales, CarsGuide, Autotrader — March 2026';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS au_market_note TEXT;
