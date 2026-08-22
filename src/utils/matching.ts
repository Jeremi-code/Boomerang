import type { LostReport, FoundReport, MatchResult } from '@/types'

/**
 * Calculate similarity between two strings using Levenshtein distance
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
 * Calculate string similarity score (0-1)
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0
  
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase())
  const maxLength = Math.max(a.length, b.length)
  return 1 - (distance / maxLength)
}

/**
 * Calculate keyword overlap between two texts
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
 * Calculate temporal similarity (0-1)
 * Closer dates = higher score
 */
function temporalSimilarity(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  // Perfect match = same day, 0 score after 30 days
  if (diffDays === 0) return 1
  if (diffDays >= 30) return 0
  
  // Exponential decay
  return Math.exp(-diffDays / 7) // Half-life of ~5 days
}

/**
 * Calculate location similarity using fuzzy matching
 */
function locationSimilarity(loc1: string, loc2: string): number {
  // Normalize locations
  const normalize = (s: string) => s.toLowerCase().trim()
  
  const l1 = normalize(loc1)
  const l2 = normalize(loc2)
  
  // Exact match
  if (l1 === l2) return 1
  
  // Check if one contains the other
  if (l1.includes(l2) || l2.includes(l1)) return 0.8
  
  // Check for common location words
  const locationWords = ['library', 'cafeteria', 'coffee', 'shop', 'building', 'hall', 'gym', 'parking', 'quad', 'field', 'entrance']
  
  let matchCount = 0
  for (const word of locationWords) {
    if (l1.includes(word) && l2.includes(word)) {
      matchCount++
    }
  }
  
  if (matchCount > 0) return 0.6
  
  // Fallback to string similarity
  return stringSimilarity(l1, l2) * 0.5
}

/**
 * Calculate category match score
 */
function categoryMatch(cat1: string, cat2: string): number {
  return cat1 === cat2 ? 1 : 0
}

/**
 * Calculate color similarity
 */
function colorSimilarity(color1: string | null, color2: string | null): number {
  if (!color1 || !color2) return 0.5 // Neutral if either is missing
  
  // Exact match
  if (color1.toLowerCase() === color2.toLowerCase()) return 1
  
  // Check for color families
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
 * Calculate brand match score
 */
function brandMatch(brand1: string | null, brand2: string | null): number {
  if (!brand1 || !brand2) return 0.5 // Neutral if either is missing
  
  return stringSimilarity(brand1, brand2)
}

/**
 * Main matching function
 * Calculates how well a lost item matches a found item
 */
export function calculateMatchScore(
  lost: LostReport,
  found: FoundReport
): MatchResult {
  const reasons: string[] = []
  let totalScore = 0
  let weightSum = 0
  
  // Category (weight: 0.3)
  const categoryScore = categoryMatch(lost.category, found.category)
  totalScore += categoryScore * 0.3
  weightSum += 0.3
  if (categoryScore === 1) {
    reasons.push('Same item category')
  }
  
  // Location (weight: 0.25)
  const locationScore = locationSimilarity(lost.location, found.locationFound)
  totalScore += locationScore * 0.25
  weightSum += 0.25
  if (locationScore > 0.6) {
    reasons.push('Similar location')
  }
  
  // Temporal (weight: 0.2)
  const temporalScore = temporalSimilarity(lost.dateLost, found.dateFound)
  totalScore += temporalScore * 0.2
  weightSum += 0.2
  if (temporalScore > 0.7) {
    reasons.push('Close in time')
  }
  
  // Description similarity (weight: 0.15)
  const descScore = keywordOverlap(lost.description, found.description)
  totalScore += descScore * 0.15
  weightSum += 0.15
  if (descScore > 0.3) {
    reasons.push('Similar description')
  }
  
  // Color (weight: 0.05)
  const colorScore = colorSimilarity(lost.color, found.color)
  totalScore += colorScore * 0.05
  weightSum += 0.05
  if (colorScore > 0.7) {
    reasons.push('Similar color')
  }
  
  // Brand (weight: 0.05)
  const brandScore = brandMatch(lost.brand, found.brand)
  totalScore += brandScore * 0.05
  weightSum += 0.05
  if (brandScore > 0.7) {
    reasons.push('Same brand')
  }
  
  // Normalize score
  const finalScore = weightSum > 0 ? (totalScore / weightSum) * 100 : 0
  
  return {
    lostReport: lost,
    foundReport: found,
    score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    reasons
  }
}

/**
 * Find all matches for lost items against found items
 * Returns matches sorted by score (best first)
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
  
  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score)
}