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

/** Design-token CSS variables used by the SVG gauge. */
export const CONFIDENCE_TIER_COLOR: Record<ConfidenceTier, string> = {
  high: 'var(--success)',
  medium: 'var(--warning)',
  low: 'var(--danger)',
}

/** Tailwind classes for pill-style badges. */
export const CONFIDENCE_TIER_BADGE_CLASS: Record<ConfidenceTier, string> = {
  high: 'bg-success-soft text-success-strong',
  medium: 'bg-warning-soft text-warning-strong',
  low: 'bg-danger-soft text-danger-strong',
}

/** Human-readable score ranges used by the info dialog. */
export const CONFIDENCE_TIER_RANGE: Record<ConfidenceTier, string> = {
  high: `${CONFIDENCE_HIGH}–100`,
  medium: `${CONFIDENCE_MEDIUM}–${CONFIDENCE_HIGH - 1}`,
  low: `0–${CONFIDENCE_MEDIUM - 1}`,
}
