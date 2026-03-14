// ============================================================
// DREAM DRIVE — Core Types
// ============================================================

export type Source = 'auction' | 'dealer_carsensor' | 'dealer_goonet' | 'au_stock'
export type ListingStatus = 'available' | 'auction_ended' | 'sold' | 'reserved'
export type AuStockStatus = 'import_pending' | 'import_approved' | 'en_route' | 'on_ship' | 'at_dock' | 'in_transit_au' | 'available_now'
export type VanSize = 'MWB' | 'LWB' | 'SLWB'
export type VanInternals = 'empty' | 'seats' | 'campervan'
export type InspectionScore = 'S' | '6' | '5.5' | '5' | '4.5' | '4' | '3.5' | '3' | 'R' | 'RA' | 'X'
export type Transmission = 'IA' | 'AT' | 'MT'
export type Drive = '2WD' | '4WD'
export type ProductCategory = 'fitout' | 'electrical' | 'poptop' | 'addon'
export type FitoutGrade = 'Excellent' | 'Good' | 'Fair' | 'Unknown'
export type PowerSystem = '100V Japanese' | '240V Australian' | 'None'
export type LeadType = 'consultation' | 'interest' | 'quiz_result' | 'finance_enquiry'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed'
export type DepositStatus = 'pending' | 'held' | 'refunded' | 'converted'

export interface Listing {
  id: string
  source: Source
  external_id: string | null
  kaijo_code: string | null
  auction_count: string | null
  bid_no: string | null
  auction_date: string | null
  model_name: string
  grade: string | null
  chassis_code: string | null
  model_year: number | null
  transmission: Transmission | null
  displacement_cc: number | null
  drive: Drive | null
  mileage_km: number | null
  inspection_score: InspectionScore | null
  body_colour: string | null
  start_price_jpy: number | null
  buy_price_jpy: number | null
  aud_estimate: number | null
  status: ListingStatus
  bid_result: string | null
  au_price_aud: number | null
  au_status: AuStockStatus | null
  eta_date: string | null
  featured: boolean
  description: string | null
  has_nav: boolean
  has_leather: boolean
  has_sunroof: boolean
  has_alloys: boolean
  photos: string[]
  size: VanSize | null
  internals: VanInternals | null
  has_fitout: boolean
  fitout_grade: FitoutGrade | null
  power_system: PowerSystem | null
  image_focal_point: string | null
  inspection_sheet: string | null
  raw_data: Record<string, unknown> | null
  scraped_at: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  slug: string
  name: string
  category: ProductCategory
  rrp_aud: number       // cents
  special_price_aud: number | null
  special_label: string | null
  special_start: string | null
  special_end: string | null
  description: string | null
  brand: string | null
  images: string[]
  visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Build {
  id: string
  share_slug: string
  user_id: string | null
  listing_id: string | null
  fitout_product_id: string | null
  elec_product_id: string | null
  poptop_product_id: string | null
  poptop_japan: boolean
  total_aud_min: number | null
  total_aud_max: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  listing?: Listing
  fitout_product?: Product
  elec_product?: Product
  poptop_product?: Product
}

export interface Lead {
  id: string
  user_id: string | null
  type: LeadType
  name: string | null
  email: string | null
  phone: string | null
  listing_id: string | null
  build_id: string | null
  estimated_value: number | null
  source: string | null
  notes: string | null
  status: LeadStatus
  created_at: string
}

export interface Deposit {
  id: string
  user_id: string | null
  listing_id: string | null
  build_id: string | null
  stripe_payment_intent: string | null
  amount_aud: number
  status: DepositStatus
  customer_email: string | null
  customer_name: string | null
  customer_phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Settings {
  jpy_aud_override: string
  shipping_estimate: string
  import_duty_pct: string
  compliance_estimate: string
  show_gst: string
  price_disclaimer: string
}

// ---- Configurator state (client-side only, not persisted directly) ----
export interface BuildState {
  listing: Listing | null
  fitout: Product | null
  electrical: Product | null
  poptop: Product | null
  poptopJapan: boolean
}

// ---- Browse filters ----
export interface BrowseFilters {
  source?: Source[]
  grade?: string[]
  yearMin?: number
  yearMax?: number
  mileageMax?: number
  scoreMin?: number
  transmission?: Transmission[]
  drive?: Drive[]
  engine?: ('diesel' | 'petrol')[]
  budgetMax?: number
}

// ---- Auction countdown helpers ----
export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}
