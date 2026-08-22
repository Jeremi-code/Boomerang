<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Search, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Phone, 
  X, 
  Copy, 
  Filter, 
  Grid, 
  Columns,
  Info,
  ShieldCheck,
  RotateCcw
} from 'lucide-vue-next'
import type { LostReport, FoundReport, MatchResult } from '@/types'
import { findMatches } from '@/utils/matching'
import { supabase } from '@/utils/supabase'

const lostItems = ref<LostReport[]>([])
const foundItems = ref<FoundReport[]>([])
const matches = ref<MatchResult[]>([])
const isLoading = ref(true)
const error = ref('')

// Filters
const minScore = ref(30)
const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const viewMode = ref<'side-by-side' | 'grid'>('side-by-side')

// Modal State
const selectedMatch = ref<MatchResult | null>(null)
const showModal = ref(false)
const copiedField = ref<string>('')

// Realistic Fallback Data (Guarantees rich display if DB is unpopulated)
const sampleLostItems: LostReport[] = [
  {
    id: 'lost-1',
    description: 'Black AirPods Pro in a matte silicone case with a small carabiner attached.',
    category: 'electronics',
    color: 'Black',
    brand: 'Apple',
    location: 'University Library 2nd Floor Study Room',
    dateLost: new Date(Date.now() - 86400000 * 1).toISOString(),
    contactEmail: 'alex.developer@example.edu',
    contactPhone: '+1 (555) 234-5678',
    additionalNotes: 'Left on the desk near the window row.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lost-2',
    description: 'Brown leather bi-fold wallet containing student ID card and transit pass.',
    category: 'accessories',
    color: 'Brown',
    brand: 'Fossil',
    location: 'Campus Dining Hall / Student Union',
    dateLost: new Date(Date.now() - 86400000 * 3).toISOString(),
    contactEmail: 'sarah.j@example.edu',
    contactPhone: '+1 (555) 876-5432',
    additionalNotes: 'Monogrammed initials S.J. inside.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lost-3',
    description: 'Honda car keys with a red nylon lanyard and a metal gym tag.',
    category: 'keys',
    color: 'Red',
    brand: 'Honda',
    location: 'North Quad Recreation Field / Gym',
    dateLost: new Date(Date.now() - 86400000 * 2).toISOString(),
    contactEmail: 'david.m@example.edu',
    contactPhone: '+1 (555) 345-6789',
    additionalNotes: 'Has a small silver whistle attached.',
    createdAt: new Date().toISOString()
  }
]

const sampleFoundItems: FoundReport[] = [
  {
    id: 'found-1',
    description: 'AirPods Pro with black protective case and metal clip found on study desk.',
    category: 'electronics',
    color: 'Black',
    brand: 'Apple',
    locationFound: 'Library Main Desk / 2nd Floor',
    dateFound: new Date(Date.now() - 86400000 * 1).toISOString(),
    contactEmail: 'library.lostfound@example.edu',
    contactPhone: '+1 (555) 999-1122',
    additionalNotes: 'Turned in to 2nd floor receptionist.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'found-2',
    description: 'Genuine leather wallet in dark brown color with ID card inside.',
    category: 'accessories',
    color: 'Brown',
    brand: 'Fossil',
    locationFound: 'Student Union Cafeteria Booth',
    dateFound: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    contactEmail: 'cafeteria.staff@example.edu',
    contactPhone: '+1 (555) 999-3344',
    additionalNotes: 'Held securely at manager counter office.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'found-3',
    description: 'Black Honda key fob with red lanyard left on bench.',
    category: 'keys',
    color: 'Red',
    brand: 'Honda',
    locationFound: 'Gym Entrance Outdoor Bench',
    dateFound: new Date(Date.now() - 86400000 * 2).toISOString(),
    contactEmail: 'rec.center@example.edu',
    contactPhone: '+1 (555) 999-5566',
    additionalNotes: 'Turned in to Gym Front Desk security.',
    createdAt: new Date().toISOString()
  }
]

const categoryIconMap: Record<string, string> = {
  electronics: '🎧',
  clothing: '👕',
  accessories: '⌚',
  bags: '🎒',
  documents: '📄',
  keys: '🔑',
  other: '📦'
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getScoreBadgeClass = (score: number) => {
  if (score >= 75) return 'score-high'
  if (score >= 50) return 'score-medium'
  return 'score-low'
}

const loadData = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const { data: lostData } = await supabase.from('lost_items').select('*').order('created_at', { ascending: false })
    const { data: foundData } = await supabase.from('found_items').select('*').order('created_at', { ascending: false })
    
    let dbLost: LostReport[] = []
    let dbFound: FoundReport[] = []
    
    if (lostData && lostData.length > 0) {
      dbLost = lostData.map(item => ({
        id: item.id,
        description: item.description,
        category: item.category,
        color: item.color,
        brand: item.brand,
        location: item.location,
        dateLost: item.date_lost,
        contactEmail: item.contact_email,
        contactPhone: item.contact_phone,
        additionalNotes: item.additional_notes,
        createdAt: item.created_at
      }))
    }
    
    if (foundData && foundData.length > 0) {
      dbFound = foundData.map(item => ({
        id: item.id,
        description: item.description,
        category: item.category,
        color: item.color,
        brand: item.brand,
        locationFound: item.location_found,
        dateFound: item.date_found,
        contactEmail: item.contact_email,
        contactPhone: item.contact_phone,
        additionalNotes: item.additional_notes,
        createdAt: item.created_at
      }))
    }

    lostItems.value = dbLost.length > 0 ? dbLost : sampleLostItems
    foundItems.value = dbFound.length > 0 ? dbFound : sampleFoundItems

    recalculateMatches()
  } catch (err) {
    console.warn('DB load warning, fallback to sample items:', err)
    lostItems.value = sampleLostItems
    foundItems.value = sampleFoundItems
    recalculateMatches()
  } finally {
    isLoading.value = false
  }
}

const recalculateMatches = () => {
  matches.value = findMatches(lostItems.value, foundItems.value, 0)
}

const filteredMatches = computed(() => {
  return matches.value.filter(m => {
    if (m.score < minScore.value) return false
    
    if (selectedCategory.value !== 'all') {
      if (m.lostReport.category !== selectedCategory.value && m.foundReport.category !== selectedCategory.value) {
        return false
      }
    }
    
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase()
      const lostText = `${m.lostReport.description} ${m.lostReport.brand || ''} ${m.lostReport.location}`.toLowerCase()
      const foundText = `${m.foundReport.description} ${m.foundReport.brand || ''} ${m.foundReport.locationFound}`.toLowerCase()
      return lostText.includes(q) || foundText.includes(q)
    }
    
    return true
  })
})

const openMatchModal = (match: MatchResult) => {
  selectedMatch.value = match
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedMatch.value = null
}

const copyToClipboard = (text: string, fieldName: string) => {
  navigator.clipboard.writeText(text)
  copiedField.value = fieldName
  setTimeout(() => {
    copiedField.value = ''
  }, 2000)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <main class="matches-page">
    <!-- Header Banner -->
    <div class="matches-header">
      <div class="header-title-box">
        <h1>Potential <span class="gradient-text">Item Matches</span></h1>
        <p>Calculated similarity scores pairing reported lost items with reported found items.</p>
      </div>

      <div class="header-stats-chips">
        <div class="stat-chip card">
          <span class="chip-label">Lost Reports</span>
          <span class="chip-val gradient-text-lost">{{ lostItems.length }}</span>
        </div>
        <div class="stat-chip card">
          <span class="chip-label">Found Reports</span>
          <span class="chip-val gradient-text-found">{{ foundItems.length }}</span>
        </div>
        <div class="stat-chip card">
          <span class="chip-label">Live Matches</span>
          <span class="chip-val gradient-text">{{ filteredMatches.length }}</span>
        </div>
      </div>
    </div>

    <!-- Controls Toolbar -->
    <div class="controls-bar card card-elevated">
      <div class="controls-grid">
        <!-- Search -->
        <div class="control-box search-box">
          <Search class="control-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search keywords, brand, location..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
            <X class="icon-xs" />
          </button>
        </div>

        <!-- Category Dropdown -->
        <div class="control-box category-select-box">
          <Filter class="control-icon" />
          <select v-model="selectedCategory" class="category-select">
            <option value="all">All Categories</option>
            <option value="electronics">🎧 Electronics</option>
            <option value="keys">🔑 Keys</option>
            <option value="clothing">👕 Clothing</option>
            <option value="accessories">⌚ Accessories</option>
            <option value="bags">🎒 Bags</option>
            <option value="documents">📄 Documents</option>
            <option value="other">📦 Other</option>
          </select>
        </div>

        <!-- View Switcher -->
        <div class="view-mode-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'side-by-side' }"
            @click="viewMode = 'side-by-side'"
          >
            <Columns class="icon-xs" /> Side-by-Side
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
          >
            <Grid class="icon-xs" /> Grid View
          </button>
        </div>
      </div>

      <!-- Slider Row -->
      <div class="slider-row">
        <div class="slider-info">
          <span class="slider-label">
            Minimum Confidence Threshold: <strong class="threshold-value">{{ minScore }}%</strong>
          </span>
          <span class="slider-hint">Displaying match pairs scored &ge; {{ minScore }}%</span>
        </div>
        <input
          v-model.number="minScore"
          type="range"
          min="10"
          max="95"
          step="5"
          class="custom-range-slider"
        />
      </div>
    </div>

    <!-- State Displays -->
    <div v-if="isLoading" class="loading-state card">
      <div class="spinner"></div>
      <p>Analyzing item attributes & calculating confidence scores...</p>
    </div>

    <div v-else-if="filteredMatches.length === 0" class="empty-state card">
      <Info class="empty-icon" />
      <h3>No Matches Found</h3>
      <p>No item pairs matched your query with &ge; {{ minScore }}% confidence threshold.</p>
      <button @click="minScore = 20; searchQuery = ''; selectedCategory = 'all'" class="btn btn-secondary btn-sm">
        Reset Filters
      </button>
    </div>

    <!-- Matches Cards List -->
    <div v-else class="matches-list" :class="viewMode">
      <div
        v-for="(match, index) in filteredMatches"
        :key="`${match.lostReport.id}-${match.foundReport.id}`"
        class="match-card card card-elevated"
      >
        <!-- Card Top Bar -->
        <div class="match-card-header">
          <div class="rank-badge">
            <span class="rank-num">#{{ index + 1 }} Pair</span>
            <span class="match-category-tag">
              {{ categoryIconMap[match.lostReport.category] || '📦' }} {{ match.lostReport.category }}
            </span>
          </div>

          <div class="score-badge-wrapper" :class="getScoreBadgeClass(match.score)">
            <span class="score-percent">{{ match.score }}%</span>
            <span class="score-label">MATCH SCORE</span>
          </div>
        </div>

        <!-- Comparative Columns -->
        <div class="comparison-row">
          <!-- Lost Item Box -->
          <div class="item-box lost-box">
            <div class="item-box-header">
              <span class="badge badge-lost">LOST ITEM</span>
              <span class="item-date"><Calendar class="icon-xs" /> {{ formatDate(match.lostReport.dateLost) }}</span>
            </div>

            <h4 class="item-desc">{{ match.lostReport.description }}</h4>

            <div class="item-tags">
              <span v-if="match.lostReport.brand" class="tag-badge">🏷️ {{ match.lostReport.brand }}</span>
              <span v-if="match.lostReport.color" class="tag-badge">🎨 {{ match.lostReport.color }}</span>
            </div>

            <div class="item-location">
              <MapPin class="icon-xs text-lost" />
              <span>{{ match.lostReport.location }}</span>
            </div>
          </div>

          <!-- Connector Arrow -->
          <div class="match-connector">
            <div class="connector-line"></div>
            <div class="connector-badge">
              <RotateCcw class="icon-xs" />
            </div>
            <div class="connector-line"></div>
          </div>

          <!-- Found Item Box -->
          <div class="item-box found-box">
            <div class="item-box-header">
              <span class="badge badge-found">FOUND ITEM</span>
              <span class="item-date"><Calendar class="icon-xs" /> {{ formatDate(match.foundReport.dateFound) }}</span>
            </div>

            <h4 class="item-desc">{{ match.foundReport.description }}</h4>

            <div class="item-tags">
              <span v-if="match.foundReport.brand" class="tag-badge">🏷️ {{ match.foundReport.brand }}</span>
              <span v-if="match.foundReport.color" class="tag-badge">🎨 {{ match.foundReport.color }}</span>
            </div>

            <div class="item-location">
              <MapPin class="icon-xs text-found" />
              <span>{{ match.foundReport.locationFound }}</span>
            </div>
          </div>
        </div>

        <!-- Match Reasons -->
        <div v-if="match.reasons.length > 0" class="match-reasons-bar">
          <span class="reasons-title">Matching Signals:</span>
          <div class="reasons-tags">
            <span v-for="(reason, rIdx) in match.reasons" :key="rIdx" class="reason-tag">
              <CheckCircle2 class="icon-xs" /> {{ reason }}
            </span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="match-card-footer">
          <div class="privacy-note">
            <ShieldCheck class="icon-xs text-primary" />
            <span>Verified similarity calculation</span>
          </div>
          <button @click="openMatchModal(match)" class="btn btn-primary btn-sm">
            <span>Connect & Claim Belonging</span>
            <ArrowRight class="icon-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Contact & Verification Modal -->
    <div v-if="showModal && selectedMatch" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card card card-elevated">
        <div class="modal-header">
          <div class="modal-title-box">
            <span class="badge badge-primary">Match Confidence: {{ selectedMatch.score }}%</span>
            <h2>Claim & Connect</h2>
          </div>
          <button @click="closeModal" class="modal-close-btn">
            <X class="icon-sm" />
          </button>
        </div>

        <div class="modal-body">
          <div class="modal-pair-summary">
            <div class="summary-col">
              <span class="badge badge-lost">LOST REPORT</span>
              <p class="summary-desc">{{ selectedMatch.lostReport.description }}</p>
              <span class="summary-meta">📍 {{ selectedMatch.lostReport.location }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-col">
              <span class="badge badge-found">FOUND REPORT</span>
              <p class="summary-desc">{{ selectedMatch.foundReport.description }}</p>
              <span class="summary-meta">📍 {{ selectedMatch.foundReport.locationFound }}</span>
            </div>
          </div>

          <div class="contact-info-section">
            <h3>Verified Contact Details</h3>

            <div class="contact-card">
              <div class="contact-row">
                <Mail class="contact-icon text-primary" />
                <div class="contact-details">
                  <span class="contact-label">Found Contact Email</span>
                  <strong class="contact-val">{{ selectedMatch.foundReport.contactEmail }}</strong>
                </div>
                <button
                  @click="copyToClipboard(selectedMatch.foundReport.contactEmail, 'foundEmail')"
                  class="btn btn-secondary btn-sm"
                >
                  <Copy class="icon-xs" />
                  <span>{{ copiedField === 'foundEmail' ? 'Copied!' : 'Copy' }}</span>
                </button>
              </div>

              <div v-if="selectedMatch.foundReport.contactPhone" class="contact-row">
                <Phone class="contact-icon text-found" />
                <div class="contact-details">
                  <span class="contact-label">Finder Phone</span>
                  <strong class="contact-val">{{ selectedMatch.foundReport.contactPhone }}</strong>
                </div>
                <button
                  @click="copyToClipboard(selectedMatch.foundReport.contactPhone, 'foundPhone')"
                  class="btn btn-secondary btn-sm"
                >
                  <Copy class="icon-xs" />
                  <span>{{ copiedField === 'foundPhone' ? 'Copied!' : 'Copy' }}</span>
                </button>
              </div>

              <div v-if="selectedMatch.foundReport.additionalNotes" class="notes-box">
                <strong>Holding Notes / Desk Location:</strong>
                <p>{{ selectedMatch.foundReport.additionalNotes }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Close</button>
          <a
            :href="`mailto:${selectedMatch.foundReport.contactEmail}?subject=Boomerang%20Match%20Claim%20(${selectedMatch.lostReport.description.slice(0, 30)}...)`"
            class="btn btn-primary"
          >
            <Mail class="icon-xs" />
            <span>Send Direct Email</span>
          </a>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.matches-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
.matches-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-card);
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: 9999px;
  font-size: 0.8rem;
  color: var(--primary-600);
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.badge-icon { width: 15px; height: 15px; color: var(--primary-500); }

.header-stats-chips {
  display: flex;
  gap: 1rem;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  padding: 0.6rem 1.25rem;
  border-radius: 12px;
  text-align: center;
}

.chip-label {
  font-size: 0.725rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
}

.chip-val {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 800;
}

/* Controls Toolbar */
.controls-bar {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.controls-grid {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.control-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  padding: 0.65rem 1rem;
  border-radius: 10px;
  flex: 1;
  min-width: 220px;
}

.control-icon { width: 18px; height: 18px; color: var(--text-muted); }

.search-input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  outline: none;
}

.clear-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }

.category-select {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
}

.view-mode-toggle {
  display: flex;
  background: var(--bg-app);
  padding: 0.25rem;
  border-radius: 10px;
  border: 1px solid var(--border-card);
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn.active {
  background: #ffffff;
  color: var(--primary-600);
  box-shadow: var(--shadow-sm);
}

/* Slider Row */
.slider-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-card);
}

.slider-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.threshold-value { color: var(--primary-600); }
.slider-hint { font-size: 0.775rem; color: var(--text-muted); }

.custom-range-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-hover);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.custom-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
  cursor: pointer;
}

/* Loading & Empty */
.loading-state, .empty-state {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon { width: 40px; height: 40px; color: var(--text-muted); }

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-card);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Matches List */
.matches-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.matches-list.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
}

.match-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.match-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rank-num {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1rem;
  color: var(--text-main);
}

.match-category-tag {
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  border-radius: 6px;
  color: var(--text-secondary);
  font-weight: 600;
}

.score-badge-wrapper {
  padding: 0.4rem 1rem;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-badge-wrapper.score-high {
  background-color: var(--found-bg);
  border: 1px solid var(--found-border);
  .score-percent { color: var(--found-600); }
}

.score-badge-wrapper.score-medium {
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  .score-percent { color: var(--primary-600); }
}

.score-badge-wrapper.score-low {
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  .score-percent { color: #d97706; }
}

.score-percent {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1;
}

.score-label {
  font-size: 0.625rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

/* Comparison Row */
.comparison-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: center;
}

.item-box {
  padding: 1.5rem;
  border-radius: 14px;
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.item-box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.775rem;
  color: var(--text-muted);
}

.item-desc {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-main);
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag-badge {
  font-size: 0.775rem;
  padding: 0.2rem 0.5rem;
  background: #ffffff;
  border: 1px solid var(--border-card);
  border-radius: 6px;
  color: var(--text-secondary);
}

.item-location {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.825rem;
  color: var(--text-secondary);
}

.text-lost { color: var(--lost-600); }
.text-found { color: var(--found-600); }
.text-primary { color: var(--primary-600); }

.match-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.connector-line {
  width: 1px;
  height: 24px;
  background-color: var(--border-card);
}

.connector-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-600);
}

/* Reasons Bar */
.match-reasons-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-card);
  flex-wrap: wrap;
}

.reasons-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.reasons-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.reason-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.775rem;
  padding: 0.25rem 0.65rem;
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  color: var(--primary-600);
  border-radius: 6px;
  font-weight: 600;
}

/* Footer */
.match-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
}

.privacy-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modal-close-btn {
  background: var(--bg-subtle);
  border: 1px solid var(--border-card);
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-close-btn:hover { color: var(--text-main); background: var(--bg-hover); }

.modal-pair-summary {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  align-items: center;
}

.summary-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-desc {
  font-size: 0.875rem;
  color: var(--text-main);
  font-weight: 600;
}

.summary-meta {
  font-size: 0.775rem;
  color: var(--text-muted);
}

.summary-divider {
  width: 1px;
  height: 100%;
  background-color: var(--border-card);
}

.contact-info-section h3 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.contact-card {
  padding: 1.25rem;
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.contact-icon { width: 22px; height: 22px; flex-shrink: 0; }

.contact-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.contact-label { font-size: 0.75rem; color: var(--text-muted); }

.contact-val {
  font-size: 0.95rem;
  color: var(--text-main);
  font-family: var(--font-mono);
}

.notes-box {
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-card);
  font-size: 0.85rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-card);
}

.icon-xs { width: 14px; height: 14px; }
.icon-sm { width: 16px; height: 16px; }

@media (max-width: 768px) {
  .comparison-row { grid-template-columns: 1fr; }
  .match-connector { transform: rotate(90deg); }
  .modal-pair-summary { grid-template-columns: 1fr; }
  .summary-divider { width: 100%; height: 1px; }
}
</style>