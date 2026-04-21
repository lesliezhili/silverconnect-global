import { Provider, PROVIDERS } from './providers'
import { distanceKm, findByPostcode, VICTORIA_POSTCODES } from './location'
import type { ServiceCategory } from './types'

export interface MatchScore {
  provider: Provider
  distanceKm: number
  score: number // 0-100
  reasons: string[]
}

export interface MatchRequest {
  customerPostcode: string
  serviceCategory?: ServiceCategory
  preferChristian?: boolean
  maxDistanceKm?: number
  fundingType?: string
}

export function matchProviders(req: MatchRequest): MatchScore[] {
  const customerPc = findByPostcode(req.customerPostcode)
  if (!customerPc) return []

  const maxDist = req.maxDistanceKm ?? 15

  const scored: MatchScore[] = []

  for (const provider of PROVIDERS) {
    if (!provider.isVerified) continue

    const providerPc = findByPostcode(provider.postcode)
    if (!providerPc) continue

    const dist = distanceKm(customerPc.lat, customerPc.lng, providerPc.lat, providerPc.lng)
    if (dist > maxDist) continue

    // Service match
    if (req.serviceCategory && (!provider.services || !provider.services.includes(req.serviceCategory))) continue

    let score = 0
    const reasons: string[] = []

    // Distance scoring (0-35 pts) — closer is better
    const distScore = Math.max(0, 35 - (dist / maxDist) * 35)
    score += distScore
    if (dist < 2) reasons.push(`Only ${dist.toFixed(1)}km away`)
    else reasons.push(`${dist.toFixed(1)}km from you`)

    // Rating scoring (0-25 pts)
    const ratingScore = ((provider.rating - 4.0) / 1.0) * 25
    score += ratingScore
    if (provider.rating >= 4.95) reasons.push('Top rated ★' + provider.rating)

    // Christian preference (0-20 pts)
    if (req.preferChristian && provider.isChristian) {
      score += 20
      reasons.push('Faith-aligned care')
    }

    // Experience (0-10 pts)
    const expScore = provider.experienceYears ? Math.min(10, provider.experienceYears * 2) : 0
    score += expScore
    if (provider.experienceYears && provider.experienceYears >= 5) reasons.push(`${provider.experienceYears} yrs experience`)

    // Featured bonus (5 pts)
    if (provider.isFeatured) { score += 5; reasons.push('Top provider') }

    // Funding compatibility (5 pts)
    if (req.fundingType === 'ndis' && provider.ndisRegistered) {
      score += 5; reasons.push('NDIS registered')
    }
    if (req.fundingType === 'dva') {
      score += 5; reasons.push('DVA accepted')
    }

    scored.push({ provider, distanceKm: dist, score: Math.round(score), reasons })
  }

  return scored.sort((a, b) => b.score - a.score)
}

export function getPostcodeCoverage() {
  return VICTORIA_POSTCODES.map(pc => {
    const providers = PROVIDERS.filter(p => p.postcode === pc.postcode && p.isVerified)
    const christians = providers.filter(p => p.isChristian).length
    const isLive = providers.length >= pc.goLiveThreshold
    return {
      ...pc,
      providerCount: providers.length,
      christianCount: christians,
      isLive,
      pctFull: Math.min(100, Math.round((providers.length / pc.goLiveThreshold) * 100)),
    }
  })
}

// Extend providers with distance from a given postcode
export function providersNearPostcode(postcode: string, maxKm = 15): MatchScore[] {
  return matchProviders({ customerPostcode: postcode, maxDistanceKm: maxKm })
}
