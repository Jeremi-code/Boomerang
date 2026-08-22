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
  Columns,
  ListOrdered,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  HeartHandshake
} from 'lucide-vue-next'
import type { LostReport, FoundReport, MatchResult } from '@/types'
import { findMatches, calculateMatchScore } from '@/utils/matching'
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
const viewMode = ref<'grouped' | 'pairs'>('grouped')

// Expanded Lost Items in Grouped View (all open by default)
const expandedLostItems = ref<Record<string, boolean>>({})

// Modal State
const selectedMatch = ref<MatchResult | null>(null)
const showModal = ref(false)
const copiedField = ref<string>('')

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
    const { data: lostData, error: lostErr } = await supabase
      .from('lost_items')
      .select('*')
      .order('created_at', { ascending: false })
      
    const { data: foundData, error: foundErr } = await supabase
      .from('found_items')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (lostErr) throw lostErr
    if (foundErr) throw foundErr

    let dbLost: LostReport[] = []
    let dbFound: FoundReport[] = []
    
    if (lostData) {
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
    
    if (foundData) {
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

    lostItems.value = dbLost
    foundItems.value = dbFound

    // Expand all lost items by default
    lostItems.value.forEach(item => {
      expandedLostItems.value[item.id] = true
    })

    recalculateMatches()
  } catch (err: unknown) {
    const errObj = err as Error
    console.error('Database load error:', errObj)
    error.value = errObj.message || 'Failed to load reports from database. Please check Supabase setup.'
    lostItems.value = []
    foundItems.value = []
    matches.value = []
  } finally {
    isLoading.value = false
  }
}

const recalculateMatches = () => {
  matches.value = findMatches(lostItems.value, foundItems.value, 0)
}

// Grouped by Lost Item computation
interface GroupedLostMatch {
  lostItem: LostReport
  candidateMatches: MatchResult[]
}

const groupedMatches = computed<GroupedLostMatch[]>(() => {
  return lostItems.value
    .map(lost => {
      // Category filter check
      if (selectedCategory.value !== 'all' && lost.category !== selectedCategory.value) {
        return null
      }

      // Calculate matches against all found items
      const candidateMatches = foundItems.value
        .map(found => calculateMatchScore(lost, found))
        .filter(m => m.score >= minScore.value)
        .sort((a, b) => b.score - a.score)

      // Search query filter check
      if (searchQuery.value.trim() !== '') {
        const q = searchQuery.value.toLowerCase()
        const lostMatchesSearch = `${lost.description} ${lost.brand || ''} ${lost.location}`.toLowerCase().includes(q)
        
        const filteredCandidates = candidateMatches.filter(m => 
          `${m.foundReport.description} ${m.foundReport.brand || ''} ${m.foundReport.locationFound}`.toLowerCase().includes(q)
        )

        if (!lostMatchesSearch && filteredCandidates.length === 0) {
          return null
        }

        return {
          lostItem: lost,
          candidateMatches: lostMatchesSearch ? candidateMatches : filteredCandidates
        }
      }

      return {
        lostItem: lost,
        candidateMatches
      }
    })
    .filter((g): g is GroupedLostMatch => g !== null)
})

// Flat list for pair view
const filteredPairMatches = computed(() => {
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

const toggleLostItemExpand = (id: string) => {
  expandedLostItems.value[id] = !expandedLostItems.value[id]
}

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
        <p>Found items ranked by match score for each reported lost item.</p>
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
          <span class="chip-label">Matched Groups</span>
          <span class="chip-val gradient-text">{{ groupedMatches.length }}</span>
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
            :class="{ active: viewMode === 'grouped' }"
            @click="viewMode = 'grouped'"
            title="Grouped by Lost Item"
          >
            <ListOrdered class="icon-xs" /> Grouped by Lost Item
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'pairs' }"
            @click="viewMode = 'pairs'"
            title="Individual Pairs View"
          >
            <Columns class="icon-xs" /> Pairs View
          </button>
        </div>
      </div>

      <!-- Slider Row -->
      <div class="slider-row">
        <div class="slider-info">
          <span class="slider-label">
            Minimum Match Threshold: <strong class="threshold-value">{{ minScore }}%</strong>
          </span>
          <span class="slider-hint">Displaying candidate items scored &ge; {{ minScore }}%</span>
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

    <!-- Error State -->
    <div v-if="error" class="alert alert-error">
      <span>{{ error }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state card">
      <div class="spinner"></div>
      <p>Fetching real-time data from Supabase database...</p>
    </div>

    <!-- Completely Empty Database State -->
    <div v-else-if="lostItems.length === 0 && foundItems.length === 0" class="empty-state card">
      <Info class="empty-icon" />
      <h3>No Database Reports Yet</h3>
      <p>There are no reported lost or found items in Supabase yet. Submit a lost or found report to test real matching!</p>
      <div class="empty-actions">
        <RouterLink to="/lost" class="btn btn-lost btn-sm">
          <PlusCircle class="icon-xs" />
          <span>Report Lost Belonging</span>
        </RouterLink>
        <RouterLink to="/found" class="btn btn-found btn-sm">
          <HeartHandshake class="icon-xs" />
          <span>Report Found Belonging</span>
        </RouterLink>
      </div>
    </div>

    <!-- No Grouped Matches State -->
    <div v-else-if="viewMode === 'grouped' && groupedMatches.length === 0" class="empty-state card">
      <Info class="empty-icon" />
      <h3>No Candidate Matches</h3>
      <p>No lost reports currently match any found items with &ge; {{ minScore }}% similarity.</p>
      <button @click="minScore = 10; searchQuery = ''; selectedCategory = 'all'" class="btn btn-secondary btn-sm">
        Lower Threshold to 10%
      </button>
    </div>

    <!-- GROUPED VIEW: List of Found Items Ranked by Score for Each Lost Item -->
    <div v-else-if="viewMode === 'grouped'" class="grouped-matches-list">
      <div
        v-for="group in groupedMatches"
        :key="group.lostItem.id"
        class="lost-group-card card card-elevated"
      >
        <!-- Lost Item Main Header Box -->
        <div class="lost-group-header" @click="toggleLostItemExpand(group.lostItem.id)">
          <div class="lost-main-info">
            <div class="lost-header-tags">
              <span class="badge badge-lost">LOST REPORT</span>
              <span class="category-pill">
                {{ categoryIconMap[group.lostItem.category] || '📦' }} {{ group.lostItem.category }}
              </span>
              <span class="candidates-count-pill">
                {{ group.candidateMatches.length }} Found Candidate{{ group.candidateMatches.length !== 1 ? 's' : '' }} Ranked
              </span>
            </div>

            <h3 class="lost-title">{{ group.lostItem.description }}</h3>

            <div class="lost-meta">
              <span>📍 {{ group.lostItem.location }}</span>
              <span>📅 {{ formatDate(group.lostItem.dateLost) }}</span>
              <span v-if="group.lostItem.color">🎨 {{ group.lostItem.color }}</span>
              <span v-if="group.lostItem.brand">🏷️ {{ group.lostItem.brand }}</span>
            </div>
          </div>

          <button class="expand-toggle-btn">
            <ChevronUp v-if="expandedLostItems[group.lostItem.id]" class="icon-sm" />
            <ChevronDown v-else class="icon-sm" />
          </button>
        </div>

        <!-- Ranked Found Candidates List -->
        <div v-if="expandedLostItems[group.lostItem.id]" class="candidates-section">
          <div class="candidates-header">
            <h4>Ranked Found Items (Sorted by Score)</h4>
          </div>

          <div v-if="group.candidateMatches.length === 0" class="no-candidates-box">
            <p class="text-muted">No found items scored above {{ minScore }}% match for this report.</p>
          </div>

          <div v-else class="candidates-list">
            <div
              v-for="(match, candidateIdx) in group.candidateMatches"
              :key="`${match.lostReport.id}-${match.foundReport.id}`"
              class="candidate-card"
            >
              <div class="candidate-top">
                <div class="candidate-rank-badge">
                  <span class="rank-number">Rank #{{ candidateIdx + 1 }}</span>
                  <span class="badge badge-found">FOUND ITEM</span>
                </div>

                <!-- Match Score Badge -->
                <div class="score-badge-wrapper" :class="getScoreBadgeClass(match.score)">
                  <span class="score-percent">{{ match.score }}%</span>
                  <span class="score-label">MATCH SCORE</span>
                </div>
              </div>

              <!-- Found Item Details -->
              <p class="candidate-desc">{{ match.foundReport.description }}</p>

              <div class="candidate-meta">
                <span class="meta-item"><MapPin class="icon-xs text-found" /> {{ match.foundReport.locationFound }}</span>
                <span class="meta-item"><Calendar class="icon-xs" /> {{ formatDate(match.foundReport.dateFound) }}</span>
                <span v-if="match.foundReport.color" class="meta-tag">🎨 {{ match.foundReport.color }}</span>
                <span v-if="match.foundReport.brand" class="meta-tag">🏷️ {{ match.foundReport.brand }}</span>
              </div>

              <!-- Match Reasons Chips -->
              <div v-if="match.reasons.length > 0" class="candidate-reasons">
                <span class="reason-label">Match Signals:</span>
                <span v-for="(reason, rIdx) in match.reasons" :key="rIdx" class="reason-tag">
                  <CheckCircle2 class="icon-xs" /> {{ reason }}
                </span>
              </div>

              <!-- Action -->
              <div class="candidate-actions">
                <button @click="openMatchModal(match)" class="btn btn-primary btn-sm">
                  <span>Claim Item & Contact Finder</span>
                  <ArrowRight class="icon-xs" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PAIRS VIEW (Individual Side-by-Side Cards) -->
    <div v-else class="matches-list pairs">
      <div v-if="filteredPairMatches.length === 0" class="empty-state card">
        <Info class="empty-icon" />
        <h3>No Pair Matches</h3>
        <p>No individual item pairs scored &ge; {{ minScore }}% match.</p>
      </div>

      <div
        v-else
        v-for="(match, index) in filteredPairMatches"
        :key="`${match.lostReport.id}-${match.foundReport.id}`"
        class="match-card card card-elevated"
      >
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

        <div class="comparison-row">
          <div class="item-box lost-box">
            <div class="item-box-header">
              <span class="badge badge-lost">LOST ITEM</span>
              <span class="item-date"><Calendar class="icon-xs" /> {{ formatDate(match.lostReport.dateLost) }}</span>
            </div>
            <h4 class="item-desc">{{ match.lostReport.description }}</h4>
            <div class="item-location">
              <MapPin class="icon-xs text-lost" />
              <span>{{ match.lostReport.location }}</span>
            </div>
          </div>

          <div class="item-box found-box">
            <div class="item-box-header">
              <span class="badge badge-found">FOUND ITEM</span>
              <span class="item-date"><Calendar class="icon-xs" /> {{ formatDate(match.foundReport.dateFound) }}</span>
            </div>
            <h4 class="item-desc">{{ match.foundReport.description }}</h4>
            <div class="item-location">
              <MapPin class="icon-xs text-found" />
              <span>{{ match.foundReport.locationFound }}</span>
            </div>
          </div>
        </div>

        <div v-if="match.reasons.length > 0" class="match-reasons-bar">
          <span class="reasons-title">Matching Signals:</span>
          <div class="reasons-tags">
            <span v-for="(reason, rIdx) in match.reasons" :key="rIdx" class="reason-tag">
              <CheckCircle2 class="icon-xs" /> {{ reason }}
            </span>
          </div>
        </div>

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
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.custom-range-slider::-webkit-slider-thumb {
  appearance: none;
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

.empty-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.no-candidates-box {
  padding: 1rem;
  background: var(--bg-app);
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-card);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* GROUPED VIEW STYLING */
.grouped-matches-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lost-group-card {
  padding: 0;
  overflow: hidden;
}

.lost-group-header {
  padding: 1.75rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.lost-group-header:hover {
  background: #ffffff;
}

.lost-main-info {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.lost-header-tags {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.category-pill {
  font-size: 0.775rem;
  padding: 0.2rem 0.6rem;
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  border-radius: 6px;
  font-weight: 600;
  color: var(--text-secondary);
}

.candidates-count-pill {
  font-size: 0.775rem;
  padding: 0.2rem 0.6rem;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: 6px;
  font-weight: 700;
  color: var(--primary-600);
}

.lost-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-main);
}

.lost-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.expand-toggle-btn {
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
}

/* Candidates Section */
.candidates-section {
  border-top: 1px solid var(--border-card);
  padding: 1.5rem 1.75rem 1.75rem;
  background: var(--bg-app);
}

.candidates-header h4 {
  font-size: 0.95rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.25rem;
}

.candidates-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.candidate-card {
  background: #ffffff;
  border: 1px solid var(--border-card);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.candidate-card:hover {
  border-color: var(--found-border);
  transform: translateY(-2px);
}

.candidate-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.candidate-rank-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.rank-number {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--primary-600);
}

.candidate-desc {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
}

.candidate-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.meta-tag {
  font-size: 0.775rem;
  padding: 0.15rem 0.5rem;
  background: var(--bg-app);
  border: 1px solid var(--border-card);
  border-radius: 4px;
}

.candidate-reasons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-card);
}

.reason-label {
  font-size: 0.775rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.reason-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.775rem;
  padding: 0.2rem 0.55rem;
  background-color: var(--found-bg);
  border: 1px solid var(--found-border);
  color: var(--found-600);
  border-radius: 6px;
  font-weight: 600;
}

.candidate-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

/* PAIRS VIEW STYLING */
.matches-list.pairs {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

.comparison-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  .matches-page {
    padding: 1.5rem 1rem 4rem;
    gap: 1.5rem;
  }

  .matches-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-stats-chips {
    width: 100%;
    justify-content: space-between;
  }

  .stat-chip {
    flex: 1;
    padding: 0.5rem 0.5rem;
  }

  .chip-label {
    font-size: 0.65rem;
  }

  .chip-val {
    font-size: 1.1rem;
  }

  .controls-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .control-box {
    width: 100%;
    min-width: 0;
  }

  .view-mode-toggle {
    width: 100%;
  }

  .view-btn {
    flex: 1;
    justify-content: center;
  }

  .comparison-row { grid-template-columns: 1fr; }
  .modal-pair-summary { grid-template-columns: 1fr; }
  .summary-divider { width: 100%; height: 1px; }

  .empty-actions {
    flex-direction: column;
    width: 100%;
  }

  .empty-actions .btn {
    width: 100%;
  }
}
</style>