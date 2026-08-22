import type { LostReport, FoundReport, MatchResult } from '@/types'

/**
 * Calculates the Levenshtein distance between two strings.
 * This is the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one string into the other.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns The edit distance between the two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  
  if (m === 0) return n
  if (n === 0) return m
  
  const matrix: number[][] = []
  
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  
  return matrix[m][n]
}

/**
 * Calculates a similarity score between two strings based on Levenshtein distance.
 * Returns a value between 0 (completely different) and 1 (identical).
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns Similarity score from 0 to 1
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0
  
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  const maxLength = Math.max(a.length, b.length)
  return 1 - (distance / maxLength)
}

/**
 * Calculates keyword overlap between two texts using Jaccard similarity.
 * Splits texts into words, filters short words (< 3 chars), and computes intersection/union.
 *
 * @param text1 - First text to compare
 * @param text2 - Second text to compare
 * @returns Jaccard similarity score from 0 to 1
 */
function keywordOverlap(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  let intersection = 0
  for (const word of words1) {
    if (words2.has(word)) {
      intersection++
    }
  }
  
  const union = words1.size + words2.size - intersection
  return intersection / union
}

/**
 * Calculates temporal similarity between two dates using exponential decay.
 * Same day returns 1, 30+ days returns 0. Half-life is approximately 5 days.
 *
 * @param date1 - ISO date string for first event
 * @param date2 - ISO date string for second event
 * @returns Temporal similarity score from 0 to 1
 */
function temporalSimilarity(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  if (diffDays === 0) return 1
  if (diffDays >= 30) return 0

  return Math.exp(-diffDays / 7)
}

/**
 * Calculates location similarity using fuzzy matching.
 * Checks for exact match, substring containment, common location keywords,
 * and falls back to string similarity.
 *
 * @param loc1 - First location string
 * @param loc2 - Second location string
 * @returns Location similarity score from 0 to 1
 */
function locationSimilarity(loc1: string, loc2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim()
  
  const l1 = normalize(loc1)
  const l2 = normalize(loc2)

  if (l1 === l2) return 1

  if (l1.includes(l2) || l2.includes(l1)) return 0.8

  const locationWords = ['library', 'cafeteria', 'coffee', 'shop', 'building', 'hall', 'gym', 'parking', 'quad', 'field', 'entrance']
  
  let matchCount = 0
  for (const word of locationWords) {
    if (l1.includes(word) && l2.includes(word)) {
      matchCount++
    }
  }
  
  if (matchCount > 0) return 0.6

  return stringSimilarity(l1, l2) * 0.5
}

/**
 * Performs exact match comparison between two category strings.
 *
 * @param cat1 - First category string
 * @param cat2 - Second category string
 * @returns 1 if categories match, 0 otherwise
 */
function categoryMatch(cat1: string, cat2: string): number {
  return cat1 === cat2 ? 1 : 0
}

/**
 * Calculates color similarity with fuzzy family matching.
 * Groups similar colors (e.g., black/charcoal/navy) and returns higher scores for same family.
 *
 * @param color1 - First color string (can be null/undefined)
 * @param color2 - Second color string (can be null/undefined)
 * @returns Color similarity score from 0.2 to 1, with 0.5 for missing values
 */
function colorSimilarity(color1: string | null | undefined, color2: string | null | undefined): number {
  if (!color1 || !color2) return 0.5

  if (color1.toLowerCase() === color2.toLowerCase()) return 1

  const colorFamilies: Record<string, string[]> = {
    'black': ['dark', 'black', 'charcoal', 'navy'],
    'white': ['white', 'cream', 'ivory', 'light'],
    'red': ['red', 'crimson', 'scarlet', 'maroon'],
    'blue': ['blue', 'navy', 'sky', 'azure'],
    'green': ['green', 'olive', 'forest', 'lime']
  }
  
  const c1 = color1.toLowerCase()
  const c2 = color2.toLowerCase()
  
  for (const family of Object.values(colorFamilies)) {
    if (family.some(c => c1.includes(c)) && family.some(c => c2.includes(c))) {
      return 0.7
    }
  }
  
  return 0.2
}

/**
 * Calculates brand match score using string similarity.
 *
 * @param brand1 - First brand string (can be null/undefined)
 * @param brand2 - Second brand string (can be null/undefined)
 * @returns Brand similarity score from 0 to 1, with 0.5 for missing values
 */
function brandMatch(brand1: string | null | undefined, brand2: string | null | undefined): number {
  if (!brand1 || !brand2) return 0.5

  return stringSimilarity(brand1, brand2)
}

/**
 * Calculates a match score between a lost item and a found item.
 * Uses weighted factors: category (30%), location (25%), time (20%),
 * description (15%), color (5%), brand (5%).
 *
 * @param lost - The lost item report
 * @param found - The found item report
 * @returns MatchResult with score (0-100%) and reasons for the match
 */
export function calculateMatchScore(
  lost: LostReport,
  found: FoundReport
): MatchResult {
  const reasons: string[] = []
  let totalScore = 0
  let weightSum = 0

  const categoryScore = categoryMatch(lost.category, found.category)
  totalScore += categoryScore * 0.3
  weightSum += 0.3
  if (categoryScore === 1) {
    reasons.push('Same item category')
  }

  const locationScore = locationSimilarity(lost.location, found.locationFound)
  totalScore += locationScore * 0.25
  weightSum += 0.25
  if (locationScore > 0.6) {
    reasons.push('Similar location')
  }

  const temporalScore = temporalSimilarity(lost.dateLost, found.dateFound)
  totalScore += temporalScore * 0.2
  weightSum += 0.2
  if (temporalScore > 0.7) {
    reasons.push('Close in time')
  }

  const descScore = keywordOverlap(lost.description, found.description)
  totalScore += descScore * 0.15
  weightSum += 0.15
  if (descScore > 0.3) {
    reasons.push('Similar description')
  }

  const colorScore = colorSimilarity(lost.color, found.color)
  totalScore += colorScore * 0.05
  weightSum += 0.05
  if (colorScore > 0.7) {
    reasons.push('Similar color')
  }

  const brandScore = brandMatch(lost.brand, found.brand)
  totalScore += brandScore * 0.05
  weightSum += 0.05
  if (brandScore > 0.7) {
    reasons.push('Same brand')
  }

  const finalScore = weightSum > 0 ? (totalScore / weightSum) * 100 : 0
  
  return {
    lostReport: lost,
    foundReport: found,
    score: Math.round(finalScore * 10) / 10,
    reasons
  }
}

/**
 * Finds all matching pairs between lost and found items above a minimum score threshold.
 * Compares every lost item against every found item and returns sorted results.
 *
 * @param lostItems - Array of lost item reports
 * @param foundItems - Array of found item reports
 * @param minScore - Minimum score threshold (default: 30)
 * @returns Array of MatchResult objects sorted by score (best first)
 */
export function findMatches(
  lostItems: LostReport[],
  foundItems: FoundReport[],
  minScore: number = 30
): MatchResult[] {
  const matches: MatchResult[] = []
  
  for (const lost of lostItems) {
    for (const found of foundItems) {
      const result = calculateMatchScore(lost, found)
      if (result.score >= minScore) {
        matches.push(result)
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score)
}