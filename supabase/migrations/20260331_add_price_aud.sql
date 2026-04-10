-- Add customer-facing price fields to listings
-- price_aud: single source of truth for display price (cents)
-- price_type: 'fixed' | 'estimate' | 'poa'
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS price_aud   int  null,
  ADD COLUMN IF NOT EXISTS price_type  text null;

-- Backfill: AU stock listings with au_price_aud → fixed price
UPDATE listings
SET price_aud  = au_price_aud,
    price_type = 'fixed'
WHERE source = 'au_stock'
  AND au_price_aud IS NOT NULL
  AND au_price_aud > 0
  AND price_aud IS NULL;

-- Backfill: Japan-sourced listings with aud_estimate → estimate
UPDATE listings
SET price_aud  = aud_estimate,
    price_type = 'estimate'
WHERE source != 'au_stock'
  AND aud_estimate IS NOT NULL
  AND aud_estimate > 0
  AND price_aud IS NULL;
