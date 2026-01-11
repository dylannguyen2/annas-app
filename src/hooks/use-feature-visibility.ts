import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

async function fetchHiddenFeatures(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('profiles')
    .select('hidden_features')
    .eq('id', user.id)
    .single()

  return data?.hidden_features || []
}

export function useFeatureVisibility() {
  const { data: hiddenFeatures = [], mutate } = useSWR('hidden-features', fetchHiddenFeatures)

  const toggleFeature = async (href: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const isHidden = hiddenFeatures.includes(href)
    const newHiddenFeatures = isHidden
      ? hiddenFeatures.filter(f => f !== href)
      : [...hiddenFeatures, href]

    await supabase
      .from('profiles')
      .update({ hidden_features: newHiddenFeatures })
      .eq('id', user.id)

    mutate(newHiddenFeatures)
  }

  const isFeatureVisible = (href: string) => !hiddenFeatures.includes(href)

  return {
    hiddenFeatures,
    toggleFeature,
    isFeatureVisible,
  }
}
