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
  red:       '#EB0A1E',
}

const s = StyleSheet.create({
  page: { backgroundColor: C.white, fontFamily: 'Helvetica', paddingBottom: 48 },

  // Header
  header: { backgroundColor: C.charcoal, paddingHorizontal: 28, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBrand: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  headerTagline: { fontSize: 8, color: C.sand, letterSpacing: 0.5 },

  // Hero
  heroWrap: { width: '100%', height: 220, backgroundColor: '#f0f0f0' },
  heroPhoto: { width: '100%', height: '100%', objectFit: 'contain' },

  // Content
  content: { paddingHorizontal: 28, paddingTop: 14 },

  // Title
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.charcoal, flex: 1, marginRight: 8 },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 7, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  price: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.ocean },
  priceNote: { fontSize: 7, color: C.gray },

  // Badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  badge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 3, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  badgeOcean: { backgroundColor: C.ocean, color: C.white },
  badgeToyota: { backgroundColor: C.red, color: C.white },
  badgeGray: { backgroundColor: C.grayLight, color: C.charcoal },

  // Specs grid
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: C.grayLight, borderLeftWidth: 1, borderLeftColor: C.grayLight, marginBottom: 10 },
  specCell: { width: '33.33%', borderRightWidth: 1, borderRightColor: C.grayLight, borderBottomWidth: 1, borderBottomColor: C.grayLight, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: C.cream },
  specLabel: { fontSize: 6, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  specValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.charcoal },

  // Desc
  descHeading: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  desc: { fontSize: 8, color: C.charcoal, lineHeight: 1.5 },

  // Build pricing — van only + pop top line items
  buildLineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.grayLight },
  buildLineLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.charcoal },
  buildLineDesc: { fontSize: 7, color: C.gray },
  buildLinePrice: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ocean },

  // Build option cards (2-up)
  cardRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  card: { flex: 1, borderWidth: 1, borderColor: C.grayLight, borderRadius: 4, overflow: 'hidden' },
  cardImage: { width: '100%', height: 80, objectFit: 'cover' },
  cardBody: { padding: 8 },
  cardName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginBottom: 2 },
  cardDesc: { fontSize: 7, color: C.gray, lineHeight: 1.4, marginBottom: 4 },
  cardPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardPriceLabel: { fontSize: 6, color: C.gray, textTransform: 'uppercase' },
  cardPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.ocean },
  cardPriceSm: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.ocean },

  // Disclaimer
  disclaimer: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#FEF9C3', borderRadius: 3, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  disclaimerText: { fontSize: 6.5, color: '#92400E', lineHeight: 1.5 },

  // Trust
  trustSection: { marginHorizontal: 28, marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.cream, borderRadius: 4 },
  trustTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginBottom: 3 },
  trustRow: { flexDirection: 'row', gap: 16 },
  trustItem: { flex: 1 },
  trustName: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.ocean, marginBottom: 1 },
  trustDesc: { fontSize: 6.5, color: C.gray, lineHeight: 1.4 },

  // CTA
  ctaBox: { backgroundColor: C.ocean, marginHorizontal: 28, marginTop: 8, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaText: { color: C.white, fontSize: 7, lineHeight: 1.5 },
  ctaUrl: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.sand },

  // Next steps
  nextSteps: { marginHorizontal: 28, marginTop: 6, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.grayLight, borderRadius: 4 },
  nextStepsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginBottom: 3 },
  nextStep: { fontSize: 7, color: C.charcoal, lineHeight: 1.6 },

  // Links
  linksRow: { marginHorizontal: 28, marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  linkText: { fontSize: 6.5, color: C.ocean, textDecoration: 'underline' },
  linkDot: { fontSize: 6.5, color: C.grayLight },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 28, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.grayLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 6.5, color: C.gray },

  // Photo pages
  photoPageHeader: { backgroundColor: C.charcoal, paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoPageTitle: { color: C.white, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  photoGrid: { flex: 1, flexDirection: 'column', padding: 12, gap: 8 },
  photoRow: { flexDirection: 'row', flex: 1, gap: 8 },
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
  heroImage:    string | null
  photoImages:  string[]
  isDealer:     boolean
  logoImage:    string | null
  // Build-up pricing
  popTopPrice:  number
  manaPrice:    number
  tamaPrice:    number
  kumaQPrice:   number
  isSLWB:       boolean
  // Build images (base64)
  popTopImage:  string | null
  manaImage:    string | null
  tamaImage:    string | null
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
  return `$${Math.round(n / 100) * 100 >= 1000 ? Math.round(n / 1000).toLocaleString('en-AU') + 'k' : n.toLocaleString('en-AU')}`
}

function fmtAudFull(n: number): string {
  return `$${n.toLocaleString('en-AU')}`
}

export default function VehiclePDF({
  id, modelName, modelYear, mileageKm, drive, engine, size,
  location, price, priceCents, priceNote, grade, gradeLabel, description,
  source, heroImage, photoImages, isDealer, logoImage,
  popTopPrice, manaPrice, tamaPrice, kumaQPrice, isSLWB,
  popTopImage, manaImage, tamaImage,
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
  const photoPages = chunkPhotos(photoImages, 6)
  const listingUrl = `https://barecamper.com.au/van/${id}`

  return (
    <Document
      title={`${modelYear ?? ''} ${modelName} — Bare Camper`}
      author="Bare Camper"
      subject="Vehicle Information Sheet"
      creator="Bare Camper · barecamper.com.au"
    >
      {/* ── PAGE 1: Vehicle Details ── */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {logoImage && <Image src={logoImage} style={{ height: 22, width: 'auto' }} />}
            {!logoImage && (
              <View>
                <Text style={s.headerBrand}>BARE CAMPER</Text>
                <Text style={s.headerTagline}>Toyota Hiace Campervans · Australia</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 7, color: '#9CA3AF' }}>barecamper.com.au</Text>
        </View>

        {/* Hero photo */}
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
            {grade && <Text style={[s.badge, gradeColour(grade)]}>Grade {grade}{gradeLabel ? ` — ${gradeLabel}` : ''}</Text>}
            {isDealer && <Text style={[s.badge, s.badgeToyota]}>Toyota Partner — Japan</Text>}
            {locationLabel(location) && <Text style={[s.badge, s.badgeOcean]}>{locationLabel(location)}</Text>}
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
            <View style={{ marginBottom: 8 }}>
              <Text style={s.descHeading}>About This Van</Text>
              <Text style={s.desc}>{description.slice(0, 300)}{description.length > 300 ? '…' : ''}</Text>
            </View>
          )}

          {/* ── Build-up pricing ── */}
          {vanPrice && (
            <View>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginBottom: 4 }}>What could this van become?</Text>
              <Text style={{ fontSize: 7, color: C.gray, marginBottom: 8 }}>Van price: ~{fmtAudFull(vanPrice)} (imported, complied & registered in Brisbane)</Text>

              {/* Row 1: Pop Top */}
              <View style={s.cardRow}>
                <View style={s.card}>
                  {popTopImage && <Image src={popTopImage} style={s.cardImage} />}
                  <View style={s.cardBody}>
                    <Text style={s.cardName}>Pop Top Roof Conversion</Text>
                    <Text style={s.cardDesc}>Professional fiberglass pop top — standing room, ventilation, bed platform up top. 10-day turnaround at our Brisbane factory.</Text>
                    <View style={s.cardPriceRow}>
                      <View>
                        <Text style={s.cardPriceLabel}>Add to van</Text>
                        <Text style={s.cardPriceSm}>+{fmtAudFull(popTopPrice)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.cardPriceLabel}>Van + Pop Top total</Text>
                        <Text style={s.cardPrice}>~{fmtAudFull(vanPrice + popTopPrice)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Row 2: MANA + TAMA side by side */}
              <View style={s.cardRow}>
                {/* MANA */}
                <View style={s.card}>
                  {manaImage && <Image src={manaImage} style={s.cardImage} />}
                  <View style={s.cardBody}>
                    <Text style={s.cardName}>MANA Conversion</Text>
                    <Text style={s.cardDesc}>Compact liveable build for two — kitchen, toilet, 200AH lithium, external shower</Text>
                    <View style={s.cardPriceRow}>
                      <View>
                        <Text style={s.cardPriceLabel}>Conversion</Text>
                        <Text style={s.cardPriceSm}>+{fmtAudFull(manaPrice)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.cardPriceLabel}>Van + MANA total</Text>
                        <Text style={s.cardPrice}>~{fmtAudFull(vanPrice + manaPrice)}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 3, paddingTop: 3, borderTopWidth: 1, borderTopColor: C.grayLight }}>
                      <View style={s.cardPriceRow}>
                        <Text style={{ fontSize: 6, color: C.gray }}>+ Pop Top</Text>
                        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ocean }}>~{fmtAudFull(vanPrice + popTopPrice + manaPrice)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* TAMA */}
                <View style={s.card}>
                  {tamaImage && <Image src={tamaImage} style={s.cardImage} />}
                  <View style={s.cardBody}>
                    <Text style={s.cardName}>TAMA Conversion</Text>
                    <Text style={s.cardDesc}>6-seat family campervan — ISOFIX, galley kitchen, walnut counters, full electrical</Text>
                    <View style={s.cardPriceRow}>
                      <View>
                        <Text style={s.cardPriceLabel}>Conversion</Text>
                        <Text style={s.cardPriceSm}>+{fmtAudFull(tamaPrice)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.cardPriceLabel}>Van + TAMA total</Text>
                        <Text style={s.cardPrice}>~{fmtAudFull(vanPrice + tamaPrice)}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 3, paddingTop: 3, borderTopWidth: 1, borderTopColor: C.grayLight }}>
                      <View style={s.cardPriceRow}>
                        <Text style={{ fontSize: 6, color: C.gray }}>+ Pop Top</Text>
                        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ocean }}>~{fmtAudFull(vanPrice + popTopPrice + tamaPrice)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* KUMA-Q row for SLWB */}
              {isSLWB && (
                <View style={s.cardRow}>
                  <View style={[s.card, { flex: 0.5 }]}>
                    <View style={s.cardBody}>
                      <Text style={s.cardName}>KUMA-Q (SLWB only)</Text>
                      <Text style={s.cardDesc}>Full-length build — queen bed, kitchen, 4-seat dining</Text>
                      <View style={s.cardPriceRow}>
                        <View>
                          <Text style={s.cardPriceLabel}>Conversion</Text>
                          <Text style={s.cardPriceSm}>+{fmtAudFull(kumaQPrice)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={s.cardPriceLabel}>Van + KUMA-Q</Text>
                          <Text style={s.cardPrice}>~{fmtAudFull(vanPrice + kumaQPrice)}</Text>
                        </View>
                      </View>
                      <View style={{ marginTop: 3, paddingTop: 3, borderTopWidth: 1, borderTopColor: C.grayLight }}>
                        <View style={s.cardPriceRow}>
                          <Text style={{ fontSize: 6, color: C.gray }}>+ Pop Top</Text>
                          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ocean }}>~{fmtAudFull(vanPrice + popTopPrice + kumaQPrice)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={{ flex: 0.5 }} />
                </View>
              )}

              {/* Disclaimer */}
              <View style={s.disclaimer}>
                <Text style={s.disclaimerText}>
                  All prices are approximate estimates. Final pricing depends on exchange rates, auction result, vehicle condition, and chosen options. We will provide an accurate quote once we understand your requirements.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Trust */}
        <View style={s.trustSection}>
          <Text style={s.trustTitle}>Backed by two specialist businesses</Text>
          <View style={s.trustRow}>
            <View style={s.trustItem}>
              <Text style={s.trustName}>Dream Drive</Text>
              <Text style={s.trustDesc}>Japan vehicle sourcing, auction bidding, compliance and full turnkey campervan conversions. Motor Dealer Licence 4816576.</Text>
            </View>
            <View style={s.trustItem}>
              <Text style={s.trustName}>DIY RV Solutions</Text>
              <Text style={s.trustDesc}>Professional fiberglass pop top and hi-top roof conversions, electrical systems, and campervan parts. Brisbane factory.</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={s.ctaBox}>
          <View>
            <Link src={listingUrl}><Text style={s.ctaUrl}>barecamper.com.au</Text></Link>
            <Text style={s.ctaText}>hello@barecamper.com.au  ·  0432 182 892</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: C.sand, fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Finance available</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 6.5 }}>40+ lenders compared for you</Text>
          </View>
        </View>

        {/* Next steps */}
        <View style={s.nextSteps}>
          <Text style={s.nextStepsTitle}>What happens next?</Text>
          <Text style={s.nextStep}>1. Call or message Jared on 0432 182 892 to chat about this van</Text>
          <Text style={s.nextStep}>2. We confirm pricing and availability within 24 hours</Text>
          <Text style={s.nextStep}>3. Pay $2,750 to reserve — we handle everything from there</Text>
          <Text style={s.nextStep}>4. Delivered to Brisbane in 6–8 weeks, complied and registered</Text>
        </View>

        {/* Links */}
        <View style={s.linksRow}>
          <Link src="https://barecamper.com.au/finance"><Text style={s.linkText}>Apply for Finance</Text></Link>
          <Text style={s.linkDot}>·</Text>
          <Link src="https://barecamper.com.au/full-build"><Text style={s.linkText}>View Full Builds</Text></Link>
          <Text style={s.linkDot}>·</Text>
          <Link src="https://barecamper.com.au/pop-top"><Text style={s.linkText}>Pop Top Conversions</Text></Link>
          <Text style={s.linkDot}>·</Text>
          <Link src="https://barecamper.com.au/import-costs"><Text style={s.linkText}>How Pricing Works</Text></Link>
          <Text style={s.linkDot}>·</Text>
          <Link src="https://barecamper.com.au/browse"><Text style={s.linkText}>Browse All Vans</Text></Link>
          <Text style={s.linkDot}>·</Text>
          <Link src={listingUrl}><Text style={s.linkText}>View This Van Online</Text></Link>
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
            <Text style={{ color: '#9CA3AF', fontSize: 7 }}>Photo Gallery</Text>
          </View>
          <View style={s.photoGrid}>
            {[0, 2, 4].map(rowStart => (
              <View key={rowStart} style={s.photoRow}>
                {batch.slice(rowStart, rowStart + 2).map((src, i) => (
                  <View key={i} style={s.photoCell}>
                    <Image src={src} style={s.photo} />
                  </View>
                ))}
                {batch.slice(rowStart, rowStart + 2).length < 2 && <View style={s.photoCell} />}
              </View>
            ))}
          </View>
          <View style={s.footer} fixed>
            <Text style={s.footerText}>Dream Drive Pty Ltd · ABN 13 030 224 315 · Motor Dealer Licence 4816576</Text>
            <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  )
}
