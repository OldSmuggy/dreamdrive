// ============================================================
// DREAM DRIVE — Core Types
// ============================================================

export type Source = 'auction' | 'dealer_carsensor' | 'dealer_goonet' | 'au_stock' | 'customer_upload'
export type ListingStatus = 'available' | 'auction_ended' | 'sold' | 'reserved' | 'draft' | 'pending_review'
export type AuStockStatus = 'import_pending' | 'import_approved' | 'en_route' | 'on_ship' | 'at_dock' | 'in_transit_au' | 'available_now'
export type LocationStatus = 'in_japan' | 'on_ship' | 'in_brisbane' | 'sold'
export type FitOutLevel = 'empty' | 'partial' | 'full'
export type VehicleModel = 'hiace_h200' | 'hiace_300' | 'coaster' | 'other'
export type VanSize = 'MWB' | 'LWB' | 'SLWB'
export type VanInternals = 'empty' | 'seats' | 'campervan'
export type InspectionScore = 'S' | '6' | '5.5' | '5' | '4.5' | '4' | '3.5' | '3' | 'R' | 'RA' | 'X'
export type Transmission = 'IA' | 'AT' | 'MT'
export type Drive = '2WD' | '4WD'
export type ProductCategory = 'fitout' | 'electrical' | 'poptop' | 'addon'
export type FitoutGrade = 'Excellent' | 'Good' | 'Fair' | 'Unknown'
export type PowerSystem = '100V Japanese' | '240V Australian' | 'None'
export type CurationBadge = 'staff_pick' | 'rare_find' | 'low_km' | 'budget_entry' | 'adventure_spec' | 'arriving_soon' | 'hot_this_week'
export type PipelineStage = 'listed' | 'purchased' | 'export_yard' | 'on_ship' | 'arrived' | 'compliance' | 'ready'
export type NoteSentiment = 'positive' | 'neutral' | 'caution'
export type NoteType = 'agent_comment' | 'extra_photos' | 'condition_flag' | 'seller_info'

export interface BuyerNote {
  id: string
  type: NoteType
  author: string
  date: string
  content: string
  sentiment: NoteSentiment
  images?: string[]
}

export interface InspirationBlock {
  title: string
  description: string
  images: string[]
  link?: string
  link_text?: string
}

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
  internal_photos: string[]
  spin_video: string | null
  show_interior_gallery: boolean
  inspection_sheet: string | null
  raw_data: Record<string, unknown> | null
  scraped_at: string | null
  created_at: string
  updated_at: string
  location_status: LocationStatus | null
  fit_out_level: FitOutLevel | null
  vehicle_model: VehicleModel | null
  conversion_video_url: string | null
  contact_phone: string | null
  condition_notes: string | null
  auction_time: string | null
  auction_result: 'pending' | 'sold' | 'unsold' | 'no_sale' | null
  sold_price_jpy: number | null
  top_bid_jpy: number | null
  auction_time_zone: string | null
  engine: string | null
  has_power_steering: boolean
  has_power_windows: boolean
  has_rear_ac: boolean
  interior_dimensions: string | null
  is_community_find: boolean
  submitted_by: string | null
  source_url: string | null
  source_category: string | null
  view_count: number
  market_comparison_aud: number | null
  // New listing enrichment fields
  curation_badge: CurationBadge | null
  notes: BuyerNote[]
  price_aud: number | null
  price_type: 'fixed' | 'estimate' | 'poa' | null
  au_market_price_low: number | null
  au_market_price_high: number | null
  au_market_source: string | null
  au_market_note: string | null
  pipeline_stage: PipelineStage | null
  pipeline_eta: string | null
  inspiration: InspirationBlock | null
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
  lead_type: string | null
  name: string | null
  email: string | null
  phone: string | null
  state: string | null
  listing_id: string | null
  build_id: string | null
  build_slug: string | null
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

export type ImportStage =
  | 'deposit_received'
  | 'sourcing'
  | 'auction_won'
  | 'shipping'
  | 'customs'
  | 'compliance'
  | 'delivered'

export type UserRole = 'customer' | 'buyer_agent' | 'admin'
export type AuctionStatus = 'watching' | 'deposit_paid' | 'bidding' | 'won' | 'lost'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_admin: boolean
  role: UserRole
  created_at: string
}

export interface AuctionMessage {
  id: string
  customer_vehicle_id: string
  user_id: string
  sender_role: 'customer' | 'buyer_agent' | 'admin'
  message: string
  created_at: string
  // joined
  sender_name?: string
}

export interface AuctionVehicle {
  id: string
  customer_id: string
  listing_id: string
  agent_id: string | null
  max_bid_jpy: number | null
  auction_status: AuctionStatus
  vehicle_status: string | null
  // joined
  listing?: Listing
  customer?: { id: string; first_name: string; last_name: string; email: string; phone: string | null }
  agent?: { id: string; first_name: string | null; last_name: string | null }
  messages?: AuctionMessage[]
  message_count?: number
}

export interface SavedVan {
  id: string
  user_id: string
  listing_id: string
  created_at: string
  listing?: Listing
}

export interface SavedBuild {
  id: string
  user_id: string
  build_id: string
  created_at: string
  build?: Build
}

export interface DepositHold {
  id: string
  user_id: string
  listing_id: string
  amount_aud: number
  status: DepositStatus
  notes: string | null
  created_at: string
  listing?: Listing
}

export interface ImportOrder {
  id: string
  user_id: string
  listing_id: string | null
  stage: ImportStage
  admin_notes: string | null
  created_at: string
  updated_at: string
  listing?: Listing
}

// ---- Deal Management ----
export type DealStatus =
  | 'draft'
  | 'deposit_pending'
  | 'deposit_received'
  | 'bidding'
  | 'won'
  | 'lost'
  | 'shipping'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface Buyer {
  id: string
  name: string
  email: string
  phone: string | null
  whatsapp_number: string | null
  company: string | null
  region: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface Deal {
  id: string
  listing_id: string
  customer_id: string
  buyer_id: string
  customer_vehicle_id: string | null
  status: DealStatus
  notes: string | null
  admin_notes: string | null
  purchase_price_jpy: number | null
  purchase_price_aud: number | null
  created_at: string
  updated_at: string
  // joined
  listing?: Listing
  customer?: { id: string; first_name: string | null; last_name: string | null; email: string; phone: string | null }
  buyer?: Buyer
}

// ---- Van Submissions (customer-uploaded vans with photos) ----
export type VanSubmissionStatus = 'pending_review' | 'approved' | 'rejected'

export interface VanSubmission {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  model_name: string
  model_year: number | null
  body_type: string | null
  mileage_km: number | null
  transmission: string | null
  asking_price_aud: number | null
  location: string | null
  notes: string | null
  photos: string[]
  status: VanSubmissionStatus
  listing_id: string | null
  finders_fee_aud: number
  fee_paid_at: string | null
  admin_notes: string | null
  auto_published: boolean
}

export interface TrustedSubmitter {
  id: string
  email: string
  name: string | null
  notes: string | null
  created_at: string
}

// ---- Vehicle Tips (Finders Fee) ----
export type VehicleTipStatus = 'pending' | 'reviewing' | 'matched' | 'paid' | 'declined'

export interface VehicleTip {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  vehicle_url: string | null
  notes: string | null
  status: VehicleTipStatus
  matched_listing_id: string | null
  finders_fee_aud: number
  paid_at: string | null
  admin_notes: string | null
  // joined
  listing?: Pick<Listing, 'id' | 'model_name' | 'model_year'>
}

// ---- Auction countdown helpers ----
export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}
