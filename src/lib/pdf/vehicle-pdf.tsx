import {
  Document, Page, Text, View, Image, StyleSheet,
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

  // Hero photo
  heroPhoto: { width: '100%', height: 240, objectFit: 'fill' },

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

  // CTA section
  ctaBox: {
    backgroundColor: C.ocean,
    marginHorizontal: 28,
    marginTop: 14,
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: { color: C.white, fontSize: 9, lineHeight: 1.6 },
  ctaUrl: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.sand },

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
  priceNote:    string | null
  grade:        string | null
  gradeLabel:   string | null
  description:  string | null
  source:       string
  heroImage:    string | null   // base64 data URL
  photoImages:  string[]        // base64 data URLs (all photos incl. hero)
  isDealer:     boolean
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

export default function VehiclePDF({
  id, modelName, modelYear, mileageKm, drive, engine, size,
  location, price, priceNote, grade, gradeLabel, description,
  source, heroImage, photoImages, isDealer,
}: VehiclePDFProps) {
  const specs = [
    { label: 'Year',     value: modelYear?.toString() ?? '—' },
    { label: 'Mileage',  value: mileageKm ? `${mileageKm.toLocaleString()} km` : '—' },
    { label: 'Drive',    value: drive ?? '—' },
    { label: 'Engine',   value: engine ?? '—' },
    { label: 'Size',     value: size ?? '—' },
    { label: 'Location', value: locationLabel(location) ?? '—' },
  ]

  const photoPages = chunkPhotos(photoImages, 6)

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

        {/* Hero photo */}
        {heroImage && (
          <Image src={heroImage} style={s.heroPhoto} />
        )}

        <View style={s.content}>
          {/* Title + price */}
          <View style={s.titleRow}>
            <Text style={s.title}>{modelName}</Text>
            {price && (
              <View style={s.priceBlock}>
                <Text style={s.priceLabel}>Price (AUD)</Text>
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
              <Text style={[s.badge, s.badgeToyota]}>✓ Toyota Verified Dealer</Text>
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
            <View style={{ marginBottom: 14 }}>
              <Text style={s.descHeading}>About This Van</Text>
              <Text style={s.desc}>{description.slice(0, 600)}{description.length > 600 ? '…' : ''}</Text>
            </View>
          )}
        </View>

        {/* CTA box */}
        <View style={s.ctaBox}>
          <View>
            <Text style={s.ctaUrl}>barecamper.com.au</Text>
            <Text style={s.ctaText}>hello@barecamper.com.au  ·  0432 182 892</Text>
            <Text style={s.ctaText}>Workshop: 1/10 Jones Road, Capalaba QLD 4157</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: C.sand, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Reserve from $3,000</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 7 }}>Delivered to Brisbane in 6–8 weeks</Text>
          </View>
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
