import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer'

const C = {
  ocean:     '#3D6B73',
  charcoal:  '#2C2C2A',
  cream:     '#F5F3ED',
  sand:      '#E8CFA0',
  white:     '#FFFFFF',
  gray:      '#6B7280',
  grayLight: '#E5E7EB',
  green:     '#166534',
  greenBg:   '#DCFCE7',
}

const s = StyleSheet.create({
  page: { backgroundColor: C.white, fontFamily: 'Helvetica', paddingBottom: 48 },

  header: {
    backgroundColor: C.charcoal,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand:   { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  headerTagline: { fontSize: 8,  color: C.sand, letterSpacing: 0.5 },
  headerRight:   { alignItems: 'flex-end' },
  headerTitle:   { fontSize: 10, color: C.sand, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  headerDate:    { fontSize: 7,  color: '#9CA3AF', marginTop: 2 },

  content: { paddingHorizontal: 28, paddingTop: 18 },

  sectionLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 14 },

  card: {
    border: 1,
    borderColor: C.grayLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.grayLight,
  },
  cardHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardBody: { paddingHorizontal: 12, paddingVertical: 10 },

  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  col2: { flex: 1 },

  fieldLabel: { fontSize: 7, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  fieldValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.charcoal },
  fieldValueSm: { fontSize: 9, color: C.charcoal },

  vanPhoto: { width: 100, height: 70, objectFit: 'cover', borderRadius: 3 },

  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.grayLight,
  },
  lineLabel: { fontSize: 9, color: C.charcoal, flex: 1 },
  lineNote: { fontSize: 7, color: C.gray, marginTop: 1 },
  linePrice: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.charcoal, marginLeft: 8 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.cream,
  },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.charcoal },
  totalPrice: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.ocean },

  notesBox: {
    border: 1,
    borderColor: C.grayLight,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    marginBottom: 10,
  },
  notesText: { fontSize: 9, color: C.charcoal, lineHeight: 1.5 },

  signatureRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  sigBlock: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: C.charcoal,
    paddingBottom: 24,
    marginTop: 24,
  },
  sigLabel: { fontSize: 7, color: C.gray, marginTop: 4 },

  confirmBox: {
    backgroundColor: C.greenBg,
    border: 1,
    borderColor: '#86EFAC',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  confirmText: { fontSize: 8, color: C.green, lineHeight: 1.5 },

  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.grayLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 7, color: C.gray },
})

export interface OrderFormPDFProps {
  buildId:        string
  shareSlug:      string
  createdAt:      string
  // Customer
  customerName:   string | null
  customerEmail:  string | null
  customerPhone:  string | null
  // Van
  vanName:        string | null
  vanYear:        number | null
  vanMileage:     number | null
  vanPrice:       string | null
  vanPhoto:       string | null    // base64 data URL
  // Build
  fitoutName:     string | null
  fitoutImage:    string | null    // base64
  electricalName: string | null
  electricalImage:string | null    // base64
  hasPopTop:      boolean
  popTopImage:    string | null    // base64
  buildLocation:  string | null
  // Price lines
  priceLines:     { label: string; note: string | null; price: string }[]
  totalAud:       string | null
  // Notes
  notes:          string | null
}

function centsStr(cents: number | null): string {
  if (!cents) return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function OrderFormPDF({
  buildId, shareSlug, createdAt,
  customerName, customerEmail, customerPhone,
  vanName, vanYear, vanMileage, vanPrice, vanPhoto,
  fitoutName, fitoutImage, electricalName, electricalImage,
  hasPopTop, popTopImage, buildLocation,
  priceLines, totalAud,
  notes,
}: OrderFormPDFProps) {
  return (
    <Document
      title={`Build Order — ${customerName ?? 'Customer'} — Bare Camper`}
      author="Bare Camper"
      subject="Vehicle Build Order Form"
      creator="Bare Camper · barecamper.com.au"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerBrand}>BARE CAMPER</Text>
            <Text style={s.headerTagline}>Toyota Hiace Campervans · Australia</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>BUILD ORDER FORM</Text>
            <Text style={s.headerDate}>{formatDate(createdAt)}  ·  Ref: {shareSlug.toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.content}>

          {/* Customer details */}
          <Text style={s.sectionLabel}>Customer Details</Text>
          <View style={s.card}>
            <View style={s.cardBody}>
              <View style={s.row}>
                <View style={s.col2}>
                  <Text style={s.fieldLabel}>Name</Text>
                  <Text style={s.fieldValue}>{customerName ?? '—'}</Text>
                </View>
                <View style={s.col2}>
                  <Text style={s.fieldLabel}>Email</Text>
                  <Text style={s.fieldValueSm}>{customerEmail ?? '—'}</Text>
                </View>
                <View style={s.col2}>
                  <Text style={s.fieldLabel}>Phone</Text>
                  <Text style={s.fieldValueSm}>{customerPhone ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Van */}
          {(vanName || vanPhoto) && (
            <>
              <Text style={s.sectionLabel}>Van</Text>
              <View style={s.card}>
                <View style={[s.cardBody, { flexDirection: 'row', gap: 12 }]}>
                  {vanPhoto && <Image src={vanPhoto} style={s.vanPhoto} />}
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldValue}>{vanName ?? '—'}</Text>
                    <Text style={[s.fieldValueSm, { marginTop: 4 }]}>
                      {[vanYear, vanMileage ? `${vanMileage.toLocaleString()} km` : null].filter(Boolean).join(' · ')}
                    </Text>
                    {vanPrice && (
                      <Text style={[s.fieldValueSm, { color: C.ocean, marginTop: 4 }]}>{vanPrice}</Text>
                    )}
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Build selections */}
          {(fitoutName || electricalName || hasPopTop) && (
            <>
              <Text style={s.sectionLabel}>Build Selections</Text>
              <View style={s.card}>
                {fitoutName && (
                  <View style={[s.cardBody, { flexDirection: 'row', gap: 10, borderBottomWidth: 1, borderBottomColor: C.grayLight }]}>
                    {fitoutImage && <Image src={fitoutImage} style={[s.vanPhoto, { width: 60, height: 42 }]} />}
                    <View>
                      <Text style={s.fieldLabel}>Conversion</Text>
                      <Text style={s.fieldValue}>{fitoutName}</Text>
                      {buildLocation && (
                        <Text style={[s.fieldValueSm, { fontSize: 8, color: C.gray }]}>
                          {buildLocation === 'japan' ? '🇯🇵 Japan build' : '🇦🇺 AU build'}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                {electricalName && (
                  <View style={[s.cardBody, { flexDirection: 'row', gap: 10, borderBottomWidth: 1, borderBottomColor: C.grayLight }]}>
                    {electricalImage && <Image src={electricalImage} style={[s.vanPhoto, { width: 60, height: 42 }]} />}
                    <View>
                      <Text style={s.fieldLabel}>Electrical System</Text>
                      <Text style={s.fieldValue}>{electricalName}</Text>
                    </View>
                  </View>
                )}
                {hasPopTop && (
                  <View style={[s.cardBody, { flexDirection: 'row', gap: 10 }]}>
                    {popTopImage && <Image src={popTopImage} style={[s.vanPhoto, { width: 60, height: 42 }]} />}
                    <View>
                      <Text style={s.fieldLabel}>Pop Top Roof</Text>
                      <Text style={s.fieldValue}>Pop Top Conversion</Text>
                      <Text style={[s.fieldValueSm, { fontSize: 8, color: C.gray }]}>Fitted in Brisbane · 10 business days</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Price breakdown */}
          {priceLines.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Price Breakdown</Text>
              <View style={s.card}>
                <View style={s.cardBody}>
                  {priceLines.map((line, i) => (
                    <View key={i} style={s.lineRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.lineLabel}>{line.label}</Text>
                        {line.note && <Text style={s.lineNote}>{line.note}</Text>}
                      </View>
                      <Text style={s.linePrice}>{line.price}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Estimated Total</Text>
                  <Text style={s.totalPrice}>{totalAud ?? '—'}</Text>
                </View>
              </View>
            </>
          )}

          {/* Notes */}
          <Text style={s.sectionLabel}>Requests & Notes</Text>
          <View style={s.notesBox}>
            <Text style={s.notesText}>{notes || 'No additional notes.'}</Text>
          </View>

          {/* Confirmation / terms */}
          <View style={s.confirmBox}>
            <Text style={s.confirmText}>
              This document is a non-binding build summary. A formal agreement and deposit invoice will follow.
              Prices are estimates based on current exchange rates and are subject to change.
              All prices AUD incl. GST. © Bare Camper / Dream Drive Pty Ltd.
            </Text>
          </View>

          {/* Signature block */}
          <View style={s.signatureRow}>
            <View style={s.col2}>
              <View style={s.sigBlock} />
              <Text style={s.sigLabel}>Customer Signature</Text>
            </View>
            <View style={s.col2}>
              <View style={s.sigBlock} />
              <Text style={s.sigLabel}>Bare Camper Representative</Text>
            </View>
            <View style={s.col2}>
              <View style={s.sigBlock} />
              <Text style={s.sigLabel}>Date</Text>
            </View>
          </View>

        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Dream Drive Pty Ltd · ABN 13 030 224 315 · Motor Dealer Licence 4816576 · barecamper.com.au</Text>
          <Text style={s.footerText}>hello@barecamper.com.au · 0432 182 892 · 1/10 Jones Road, Capalaba QLD 4157</Text>
        </View>
      </Page>
    </Document>
  )
}
