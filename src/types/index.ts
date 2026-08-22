export interface LostReport {
  id: string
  description: string
  category: ItemCategory
  color?: string
  brand?: string
  location: string
  dateLost: string
  contactEmail: string
  contactPhone?: string
  additionalNotes?: string
  createdAt: string
}

export interface FoundReport {
  id: string
  description: string
  category: ItemCategory
  color?: string
  brand?: string
  locationFound: string
  dateFound: string
  contactEmail: string
  contactPhone?: string
  additionalNotes?: string
  createdAt: string
}

export interface MatchResult {
  lostReport: LostReport
  foundReport: FoundReport
  score: number
  reasons: string[]
}

export type ItemCategory = 
  | 'electronics'
  | 'clothing'
  | 'accessories'
  | 'bags'
  | 'documents'
  | 'keys'
  | 'other'

export const ITEM_CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'bags', label: 'Bags' },
  { value: 'documents', label: 'Documents' },
  { value: 'keys', label: 'Keys' },
  { value: 'other', label: 'Other' }
]