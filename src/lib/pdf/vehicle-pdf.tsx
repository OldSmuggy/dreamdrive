import {
  Document, Page, Text, View, Image, StyleSheet, Link,
} from '@react-pdf/renderer'

// Brand colours
const C = {
  ocean:     '#3D6B73',
  oceanDark: '#2d5158',
  charcoal:  '#2C2C2A',
  cream:     '#F5F3ED',
  sand:      '#E8CFA0',
  white:     '#FFFFFF',
  gray:      '#6B7280',
  grayLight: '#E5E7EB',
  red:       '#EB0A1E',  // Toyota
}

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: 'Helvetica',
    paddingBottom: 48,
  },

  // Header bar
  header: {
    backgroundColor: C.charcoal,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  headerTagline: { fontSize: 8, color: C.sand, letterSpacing: 0.5 },

  // Hero photo — aspect-ratio preserved
  heroWrap: { width: '100%', height: 230, backgroundColor: '#f0f0f0' },
  heroPhoto: { width: '100%', height: '100%', objectFit: 'contain' },

  // Content area
  content: { paddingHorizontal: 28, paddingTop: 18 },

  // Title row
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.charcoal, flex: 1, marginRight: 8 },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 8, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  price: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.ocean },
  priceNote: { fontSize: 8, color: C.gray },

  // Badges row
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  badgeOcean: { backgroundColor: C.ocean, color: C.white },
  badgeToyota: { backgroundColor: C.red, color: C.white },
  badgeGray: { backgroundColor: C.grayLight, color: C.charcoal },
  badgeAmber: { backgroundColor: '#FEF3C7', color: '#92400E' },

  // Specs grid
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: C.grayLight,
    borderLeftWidth: 1,
    borderLeftColor: C.grayLight,
    marginBottom: 16,
  },
  specCell: {
    width: '33.33%',
    borderRightWidth: 1,
    borderRightColor: C.grayLight,
    borderBottomWidth: 1,
    borderBottomColor: C.grayLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: C.cream,
  },
  specLabel: { fontSize: 7, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  specValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.charcoal },

  // Description
  descHeading: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  desc: { fontSize: 9, color: C.charcoal, lineHeight: 1.5 },

  // Build options section
  buildSection: { marginTop: 4 },
  buildTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginBottom: 8 },
  buildRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.grayLight,
  },
  buildRowAlt: { backgroundColor: C.cream },
  buildLabel: { fontSize: 9, color: C.charcoal, flex: 1 },
  buildDesc: { fontSize: 7, color: C.gray, marginTop: 1 },
  buildPrice: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.ocean, textAlign: 'right', width: 80 },
  buildTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: C.ocean,
    borderRadius: 3,
    marginTop: 2,
  },
  buildTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white },
  buildTotalPrice: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.sand },

  // Disclaimer
  disclaimer: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FEF9C3',
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  disclaimerText: { fontSize: 7, color: '#92400E', lineHeight: 1.5 },

  // Trust section
  trustSection: {
    marginHorizontal: 28,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.cream,
    borderRadius: 4,
  },
  trustTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginBottom: 4 },
  trustRow: { flexDirection: 'row', gap: 20 },
  trustItem: { flex: 1 },
  trustName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ocean, marginBottom: 1 },
  trustDesc: { fontSize: 7, color: C.gray, lineHeight: 1.4 },

  // CTA section
  ctaBox: {
    backgroundColor: C.ocean,
    marginHorizontal: 28,
    marginTop: 10,
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: { color: C.white, fontSize: 8, lineHeight: 1.5 },
  ctaUrl: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.sand },

  // Next steps
  nextSteps: {
    marginHorizontal: 28,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.grayLight,
    borderRadius: 4,
  },
  nextStepsTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginBottom: 4 },
  nextStep: { fontSize: 8, color: C.charcoal, lineHeight: 1.6 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.grayLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 7, color: C.gray },

  // Photo pages
  photoPageHeader: {
    backgroundColor: C.charcoal,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoPageTitle: { color: C.white, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  photoGrid: {
    flex: 1,
    flexDirection: 'column',
    padding: 12,
    gap: 8,
  },
  photoRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  photoCell: { flex: 1 },
  photo: { width: '100%', height: '100%', objectFit: 'contain', borderRadius: 3 },
})

export interface VehiclePDFProps {
  id:           string
  modelName:    string
  modelYear:    number | null
  mileageKm:    number | null
  drive:        string | null
  engine:       string | null
  size:         string | null
  location:     string | null
  price:        string | null
  priceCents:   number | null
  priceNote:    string | null
  grade:        string | null
  gradeLabel:   string | null
  description:  string | null
  source:       string
  heroImage:    string | null   // base64 data URL
  photoImages:  string[]        // base64 data URLs (all photos incl. hero)
  isDealer:     boolean
  // Build-up pricing
  popTopPrice:  number          // AUD
  manaPrice:    number          // AUD
  tamaPrice:    number          // AUD
  kumaQPrice:   number          // AUD (only shown for SLWB vans)
  isSLWB:       boolean
}

function gradeColour(grade: string | null) {
  if (!grade) return s.badgeGray
  if (['S','6','5.5','5'].includes(grade)) return { backgroundColor: '#DCFCE7', color: '#166534', ...s.badge }
  if (['4.5','4'].includes(grade)) return { backgroundColor: '#FEF9C3', color: '#854D0E', ...s.badge }
  return { backgroundColor: C.grayLight, color: C.charcoal, ...s.badge }
}

function locationLabel(loc: string | null) {
  if (!loc) return null
  if (loc === 'in_brisbane') return 'In Brisbane'
  if (loc === 'on_ship')     return 'On Ship — Arriving Soon'
  if (loc === 'in_japan')    return 'In Japan'
  return null
}

function chunkPhotos(arr: string[], size: number): string[][] {
  const out: string[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function fmtAud(n: number): string {
  return `$${n.toLocaleString('en-AU')}`
}

export default function VehiclePDF({
  id, modelName, modelYear, mileageKm, drive, engine, size,
  location, price, priceCents, priceNote, grade, gradeLabel, description,
  source, heroImage, photoImages, isDealer,
  popTopPrice, manaPrice, tamaPrice, kumaQPrice, isSLWB,
}: VehiclePDFProps) {
  const specs = [
    { label: 'Year',     value: modelYear?.toString() ?? '—' },
    { label: 'Mileage',  value: mileageKm ? `${mileageKm.toLocaleString()} km` : '—' },
    { label: 'Drive',    value: drive ?? '—' },
    { label: 'Engine',   value: engine ?? '—' },
    { label: 'Size',     value: size ?? '—' },
    { label: 'Location', value: locationLabel(location) ?? '—' },
  ]

  const vanPrice = priceCents ? Math.round(priceCents / 100) : null

  // Build option rows — pop top is always separate, conversion prices are ON TOP of pop top
  const buildOptions = [
    { label: 'This van only', desc: 'Imported, complied & registered — ready to drive', price: vanPrice },
    { label: 'Van + Pop Top roof', desc: 'Fiberglass pop top installed — standing room & ventilation (pop top not included in builds below)', price: vanPrice ? vanPrice + popTopPrice : null },
    { label: 'Van + Pop Top + MANA build', desc: 'Compact liveable conversion — kitchen, toilet, 200AH lithium + pop top', price: vanPrice ? vanPrice + popTopPrice + manaPrice : null },
    { label: 'Van + Pop Top + TAMA build', desc: '6-seat family campervan — ISOFIX, galley kitchen, full electrical + pop top', price: vanPrice ? vanPrice + popTopPrice + tamaPrice : null },
  ]
  if (isSLWB) {
    buildOptions.push({
      label: 'Van + Pop Top + KUMA-Q build',
      desc: 'Full-length SLWB conversion — queen bed, kitchen, 4-seat dining + pop top',
      price: vanPrice ? vanPrice + popTopPrice + kumaQPrice : null,
    })
  }

  const photoPages = chunkPhotos(photoImages, 6)
  const listingUrl = `https://barecamper.com.au/van/${id}`

  return (
    <Document
      title={`${modelYear ?? ''} ${modelName} — Bare Camper`}
      author="Bare Camper"
      subject="Vehicle Information Sheet"
      creator="Bare Camper · barecamper.com.au"
      keywords="toyota hiace campervan australia"
    >
      {/* ── PAGE 1: Marketing one-pager ── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerBrand}>BARE CAMPER</Text>
            <Text style={s.headerTagline}>Toyota Hiace Campervans · Australia</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#9CA3AF' }}>barecamper.com.au</Text>
        </View>

        {/* Hero photo — contained, not stretched */}
        {heroImage && (
          <View style={s.heroWrap}>
            <Image src={heroImage} style={s.heroPhoto} />
          </View>
        )}

        <View style={s.content}>
          {/* Title + price */}
          <View style={s.titleRow}>
            <Text style={s.title}>{modelName}</Text>
            {price && (
              <View style={s.priceBlock}>
                <Text style={s.priceLabel}>Van Price (AUD)</Text>
                <Text style={s.price}>{price}</Text>
                {priceNote && <Text style={s.priceNote}>{priceNote}</Text>}
              </View>
            )}
          </View>

          {/* Badges */}
          <View style={s.badgeRow}>
            {grade && (
              <Text style={[s.badge, gradeColour(grade)]}>
                Grade {grade}{gradeLabel ? ` — ${gradeLabel}` : ''}
              </Text>
            )}
            {isDealer && (
              <Text style={[s.badge, s.badgeToyota]}>Toyota Partner — Japan</Text>
            )}
            {locationLabel(location) && (
              <Text style={[s.badge, s.badgeOcean]}>{locationLabel(location)}</Text>
            )}
          </View>

          {/* Specs grid */}
          <View style={s.specsGrid}>
            {specs.map(({ label, value }) => (
              <View key={label} style={s.specCell}>
                <Text style={s.specLabel}>{label}</Text>
                <Text style={s.specValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {description && (
            <View style={{ marginBottom: 10 }}>
              <Text style={s.descHeading}>About This Van</Text>
              <Text style={s.desc}>{description.slice(0, 400)}{description.length > 400 ? '…' : ''}</Text>
            </View>
          )}

          {/* ── Build-up pricing ── */}
          {vanPrice && (
            <View style={s.buildSection}>
              <Text style={s.buildTitle}>What could this van become?</Text>
              {buildOptions.map((opt, i) => (
                <View key={opt.label} style={[s.buildRow, i % 2 === 1 ? s.buildRowAlt : {}]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.buildLabel}>{opt.label}</Text>
                    <Text style={s.buildDesc}>{opt.desc}</Text>
                  </View>
                  <Text style={s.buildPrice}>{opt.price ? `~${fmtAud(opt.price)}` : '—'}</Text>
                </View>
              ))}

              {/* Disclaimer */}
              <View style={s.disclaimer}>
                <Text style={s.disclaimerText}>
                  Prices are approximate estimates only. Final pricing depends on exchange rates, auction result, vehicle condition, and your chosen options. We&apos;ll provide an accurate quote once we know more about your requirements.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Trust section */}
        <View style={s.trustSection}>
          <Text style={s.trustTitle}>Backed by two specialist businesses</Text>
          <View style={s.trustRow}>
            <View style={s.trustItem}>
              <Text style={s.trustName}>Dream Drive</Text>
              <Text style={s.trustDesc}>Japan vehicle sourcing, import logistics, auction bidding, compliance and full turnkey campervan conversions. Motor Dealer Licence 4816576.</Text>
            </View>
            <View style={s.trustItem}>
              <Text style={s.trustName}>DIY RV Solutions</Text>
              <Text style={s.trustDesc}>Professional fiberglass pop top and hi-top roof conversions, electrical systems, and campervan parts. Brisbane factory, 10-day turnaround.</Text>
            </View>
          </View>
        </View>

        {/* CTA box */}
        <View style={s.ctaBox}>
          <View>
            <Link src={listingUrl}>
              <Text style={s.ctaUrl}>barecamper.com.au</Text>
            </Link>
            <Text style={s.ctaText}>hello@barecamper.com.au  ·  0432 182 892</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: C.sand, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Finance available</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 7 }}>40+ lenders compared for you</Text>
          </View>
        </View>

        {/* Next steps */}
        <View style={s.nextSteps}>
          <Text style={s.nextStepsTitle}>What happens next?</Text>
          <Text style={s.nextStep}>1. Call or message Jared on 0432 182 892 to chat about this van</Text>
          <Text style={s.nextStep}>2. We&apos;ll confirm pricing and availability within 24 hours</Text>
          <Text style={s.nextStep}>3. Pay $2,750 to reserve — we handle everything from there</Text>
          <Text style={s.nextStep}>4. Delivered to Brisbane in 6–8 weeks, complied and registered</Text>
        </View>

        {/* Useful links */}
        <View style={{ marginHorizontal: 28, marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Link src="https://barecamper.com.au/finance"><Text style={{ fontSize: 7, color: C.ocean, textDecoration: 'underline' }}>Apply for Finance</Text></Link>
          <Text style={{ fontSize: 7, color: C.grayLight }}>·</Text>
          <Link src="https://barecamper.com.au/full-build"><Text style={{ fontSize: 7, color: C.ocean, textDecoration: 'underline' }}>View Full Builds</Text></Link>
          <Text style={{ fontSize: 7, color: C.grayLight }}>·</Text>
          <Link src="https://barecamper.com.au/pop-top"><Text style={{ fontSize: 7, color: C.ocean, textDecoration: 'underline' }}>Pop Top Conversions</Text></Link>
          <Text style={{ fontSize: 7, color: C.grayLight }}>·</Text>
          <Link src="https://barecamper.com.au/import-costs"><Text style={{ fontSize: 7, color: C.ocean, textDecoration: 'underline' }}>How Pricing Works</Text></Link>
          <Text style={{ fontSize: 7, color: C.grayLight }}>·</Text>
          <Link src="https://barecamper.com.au/browse"><Text style={{ fontSize: 7, color: C.ocean, textDecoration: 'underline' }}>Browse All Vans</Text></Link>
          <Text style={{ fontSize: 7, color: C.grayLight }}>·</Text>
          <Link src={listingUrl}><Text style={{ fontSize: 7, color: C.ocean, textDecoration: 'underline' }}>View This Van Online</Text></Link>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Dream Drive Pty Ltd · ABN 13 030 224 315 · Motor Dealer Licence 4816576</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ── PAGE 2+: Photo gallery ── */}
      {photoPages.map((batch, pi) => (
        <Page key={pi} size="A4" style={s.page}>
          <View style={s.photoPageHeader}>
            <Text style={s.photoPageTitle}>BARE CAMPER  ·  {modelName}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 8 }}>Photo Gallery</Text>
          </View>

          <View style={s.photoGrid}>
            {[0, 2, 4].map(rowStart => (
              <View key={rowStart} style={s.photoRow}>
                {batch.slice(rowStart, rowStart + 2).map((src, i) => (
                  <View key={i} style={s.photoCell}>
                    <Image src={src} style={s.photo} />
                  </View>
                ))}
                {/* Fill empty slot if odd number of photos */}
                {batch.slice(rowStart, rowStart + 2).length < 2 && (
                  <View style={s.photoCell} />
                )}
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={s.footer} fixed>
            <Text style={s.footerText}>Dream Drive Pty Ltd · ABN 13 030 224 315 · Motor Dealer Licence 4816576</Text>
            <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  )
}
