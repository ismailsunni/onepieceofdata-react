import { supabase } from '../services/supabase'

/**
 * Script to populate saga_id for arcs based on chapter ranges
 * Run this once to update the database
 */
async function updateArcSagaIds() {
  if (!supabase) {
    console.error('Supabase client is not initialized')
    return
  }

  console.log('Fetching sagas...')
  const { data: sagas, error: sagaError } = await supabase
    .from('saga')
    .select('*')
    .order('start_chapter', { ascending: true })

  if (sagaError) {
    console.error('Error fetching sagas:', sagaError)
    return
  }

  console.log(`Found ${sagas?.length || 0} sagas`)

  console.log('Fetching arcs...')
  const { data: arcs, error: arcError } = await supabase
    .from('arc')
    .select('*')
    .order('start_chapter', { ascending: true })

  if (arcError) {
    console.error('Error fetching arcs:', arcError)
    return
  }

  console.log(`Found ${arcs?.length || 0} arcs`)

  // Match each arc to a saga based on chapter ranges
  let updatedCount = 0
  let skippedCount = 0

  for (const arc of arcs || []) {
    // Find the saga that contains this arc's start_chapter
    const matchingSaga = sagas?.find(
      (saga) =>
        arc.start_chapter >= saga.start_chapter &&
        arc.start_chapter <= saga.end_chapter
    )

    if (matchingSaga) {
      console.log(
        `Arc "${arc.title}" (Ch. ${arc.start_chapter}-${arc.end_chapter}) -> Saga "${matchingSaga.title}"`
      )

      // Update the arc with the matching saga_id
      const { error: updateError } = await supabase
        .from('arc')
        .update({ saga_id: matchingSaga.saga_id })
        .eq('arc_id', arc.arc_id)

      if (updateError) {
        console.error(`Error updating arc ${arc.arc_id}:`, updateError)
      } else {
        updatedCount++
      }
    } else {
      console.log(
        `⚠️  No saga found for arc "${arc.title}" (Ch. ${arc.start_chapter}-${arc.end_chapter})`
      )
      skippedCount++
    }
  }

  console.log('\n✅ Update complete!')
  console.log(`Updated: ${updatedCount} arcs`)
  console.log(`Skipped: ${skippedCount} arcs (no matching saga)`)
}

// Run the script
console.log('Starting saga_id update script...\n')
updateArcSagaIds()
  .then(() => {
    console.log('\nScript finished successfully!')
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
  })
