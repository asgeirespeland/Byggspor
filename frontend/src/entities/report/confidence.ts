/**
 * Single source of truth for confidence tier thresholds, labels, and colour classes.
 * Consumers: ConfidenceGauge (widgets), confidenceBadge (report utils), ConfidenceInfo (dashboard).
 */

export const CONFIDENCE_HIGH = 80
export const CONFIDENCE_MEDIUM = 50

export type ConfidenceTier = 'high' | 'medium' | 'low'

export function confidenceTier(score: number): ConfidenceTier {
  if (score >= CONFIDENCE_HIGH) return 'high'
  if (score >= CONFIDENCE_MEDIUM) return 'medium'
  return 'low'
}

export const CONFIDENCE_TIER_LABEL: Record<ConfidenceTier, string> = {
  high: 'Høy',
  medium: 'Middels',
  low: 'Lav',
}

/** Hex colours used by the SVG gauge. */
export const CONFIDENCE_TIER_COLOR: Record<ConfidenceTier, string> = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
}

/** Tailwind classes for pill-style badges. */
export const CONFIDENCE_TIER_BADGE_CLASS: Record<ConfidenceTier, string> = {
  high: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-red-50 text-red-700',
}

/** Human-readable score ranges used by the info dialog. */
export const CONFIDENCE_TIER_RANGE: Record<ConfidenceTier, string> = {
  high: `${CONFIDENCE_HIGH}–100`,
  medium: `${CONFIDENCE_MEDIUM}–${CONFIDENCE_HIGH - 1}`,
  low: `0–${CONFIDENCE_MEDIUM - 1}`,
}
