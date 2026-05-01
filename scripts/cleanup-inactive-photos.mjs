#!/usr/bin/env node
/**
 * Cleanup script: deletes storage files for inactive (draft/auction_ended) listings,
 * then deletes the listings themselves.
 *
 * Usage: node scripts/cleanup-inactive-photos.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  // 1. Get all inactive listings
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, model_name, model_year, status, photos')
    .in('status', ['draft', 'auction_ended', 'pending_review', 'reserved'])

  if (error) { console.error('Failed to fetch listings:', error.message); process.exit(1) }

  console.log(`Found ${listings.length} inactive listings to clean up\n`)

  let totalDeleted = 0
  let totalFailed = 0

  for (const listing of listings) {
    const title = `${listing.model_year ?? ''} ${listing.model_name} (${listing.status})`
    const photos = listing.photos ?? []

    // Extract storage paths from Supabase URLs
    const storagePaths = photos
      .filter(url => url.includes('supabase'))
      .map(url => {
        const match = url.match(/listing-images\/(.+)$/)
        return match ? match[1] : null
      })
      .filter(Boolean)

    if (storagePaths.length === 0) {
      console.log(`  ${title} — no storage photos, skipping files`)
    } else {
      // Delete in batches of 100 (Supabase limit)
      for (let i = 0; i < storagePaths.length; i += 100) {
        const batch = storagePaths.slice(i, i + 100)
        const { error: delErr } = await supabase.storage
          .from('listing-images')
          .remove(batch)

        if (delErr) {
          console.error(`  ${title} — failed to delete batch: ${delErr.message}`)
          totalFailed += batch.length
        } else {
          totalDeleted += batch.length
        }
      }
      console.log(`  ${title} — deleted ${storagePaths.length} photos`)
    }
  }

  console.log(`\nStorage cleanup: ${totalDeleted} files deleted, ${totalFailed} failed`)

  // 2. Delete the listings themselves
  const listingIds = listings.map(l => l.id)
  const { error: deleteErr, count } = await supabase
    .from('listings')
    .delete()
    .in('id', listingIds)

  if (deleteErr) {
    console.error(`Failed to delete listings: ${deleteErr.message}`)
  } else {
    console.log(`Deleted ${count ?? listingIds.length} inactive listings from database`)
  }

  // 3. Also clean up orphaned storage files
  console.log('\nChecking for orphaned storage files...')

  // Get all remaining photo URLs from active listings
  const { data: activeLists } = await supabase
    .from('listings')
    .select('photos, internal_photos')

  const { data: submissions } = await supabase
    .from('van_submissions')
    .select('photos')

  const referencedPaths = new Set()
  for (const l of (activeLists ?? [])) {
    for (const url of [...(l.photos ?? []), ...(l.internal_photos ?? [])]) {
      const match = url.match(/listing-images\/(.+)$/)
      if (match) referencedPaths.add(match[1])
    }
  }
  for (const s of (submissions ?? [])) {
    for (const url of (s.photos ?? [])) {
      const match = url.match(/listing-images\/(.+)$/)
      if (match) referencedPaths.add(match[1])
    }
  }

  // List all storage objects
  const { data: objects } = await supabase.storage
    .from('listing-images')
    .list('listings', { limit: 5000 })

  const orphans = (objects ?? [])
    .filter(obj => !referencedPaths.has(`listings/${obj.name}`))
    .map(obj => `listings/${obj.name}`)

  if (orphans.length > 0) {
    console.log(`Found ${orphans.length} orphaned files`)
    for (let i = 0; i < orphans.length; i += 100) {
      const batch = orphans.slice(i, i + 100)
      const { error: orphanErr } = await supabase.storage
        .from('listing-images')
        .remove(batch)
      if (orphanErr) {
        console.error(`  Failed to delete orphan batch: ${orphanErr.message}`)
      }
    }
    console.log(`Deleted ${orphans.length} orphaned files`)
  } else {
    console.log('No orphaned files found')
  }

  console.log('\nDone! Check Supabase dashboard for updated storage usage.')
}

main().catch(console.error)
