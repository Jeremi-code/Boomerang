<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { LostReport, FoundReport, MatchResult } from '@/types'
import { findMatches } from '@/utils/matching'
import { supabase } from '@/utils/supabase'

const lostItems = ref<LostReport[]>([])
const foundItems = ref<FoundReport[]>([])
const matches = ref<MatchResult[]>([])
const isLoading = ref(true)
const error = ref('')
const minScore = ref(30)

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get score color class
const getScoreClass = (score: number) => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  if (score >= 40) return 'score-low'
  return 'score-very-low'
}

// Load data from Supabase
const loadData = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    // Fetch lost items
    const { data: lostData, error: lostError } = await supabase
      .from('lost_items')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (lostError) throw lostError
    
    // Fetch found items
    const { data: foundData, error: foundError } = await supabase
      .from('found_items')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (foundError) throw foundError
    
    // Map database fields to our types
    lostItems.value = (lostData || []).map(item => ({
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
    
    foundItems.value = (foundData || []).map(item => ({
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
    
    // Calculate matches
    matches.value = findMatches(lostItems.value, foundItems.value, minScore.value)
    
  } catch (err: unknown) {
    console.error('Error loading data:', err)
    error.value = err instanceof Error ? err.message : 'An error occurred while loading data'
  } finally {
    isLoading.value = false
  }
}

// Recalculate matches when minScore changes
const updateMatches = () => {
  matches.value = findMatches(lostItems.value, foundItems.value, minScore.value)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <main>
    <h1>Potential Matches</h1>
    <p>View potential matches between lost and found items.</p>
    
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
    
    <div class="controls">
      <div class="control-group">
        <label class="form-label" for="minScore">Minimum Match Score: {{ minScore }}%</label>
        <input
          id="minScore"
          v-model.number="minScore"
          type="range"
          min="0"
          max="100"
          step="5"
          class="score-slider"
          @input="updateMatches"
        />
      </div>
      
      <div class="stats">
        <span class="stat">{{ lostItems.length }} lost items</span>
        <span class="stat">{{ foundItems.length }} found items</span>
        <span class="stat">{{ matches.length }} potential matches</span>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading">
      Loading data...
    </div>
    
    <div v-else-if="matches.length === 0" class="no-matches">
      <p>No potential matches found above {{ minScore }}% confidence.</p>
      <p>Try lowering the minimum score or check back later for new reports.</p>
    </div>
    
    <div v-else class="matches-list">
      <div v-for="(match, index) in matches" :key="`${match.lostReport.id}-${match.foundReport.id}`" class="match-card">
        <div class="match-header">
          <span class="match-rank">#{{ index + 1 }}</span>
          <span class="match-score" :class="getScoreClass(match.score)">
            {{ match.score }}% match
          </span>
        </div>
        
        <div class="match-content">
          <div class="item-column lost">
            <h3>Lost Item</h3>
            <div class="item-details">
              <p class="item-description">{{ match.lostReport.description }}</p>
              <div class="item-meta">
                <span v-if="match.lostReport.category" class="meta-item">
                  📁 {{ match.lostReport.category }}
                </span>
                <span v-if="match.lostReport.color" class="meta-item">
                  🎨 {{ match.lostReport.color }}
                </span>
                <span v-if="match.lostReport.brand" class="meta-item">
                  🏷️ {{ match.lostReport.brand }}
                </span>
              </div>
              <div class="item-location">
                📍 {{ match.lostReport.location }} • 📅 {{ formatDate(match.lostReport.dateLost) }}
              </div>
            </div>
          </div>
          
          <div class="match-arrow">→</div>
          
          <div class="item-column found">
            <h3>Found Item</h3>
            <div class="item-details">
              <p class="item-description">{{ match.foundReport.description }}</p>
              <div class="item-meta">
                <span v-if="match.foundReport.category" class="meta-item">
                  📁 {{ match.foundReport.category }}
                </span>
                <span v-if="match.foundReport.color" class="meta-item">
                  🎨 {{ match.foundReport.color }}
                </span>
                <span v-if="match.foundReport.brand" class="meta-item">
                  🏷️ {{ match.foundReport.brand }}
                </span>
              </div>
              <div class="item-location">
                📍 {{ match.foundReport.locationFound }} • 📅 {{ formatDate(match.foundReport.dateFound) }}
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="match.reasons.length > 0" class="match-reasons">
          <strong>Why this matches:</strong>
          <span v-for="(reason, i) in match.reasons" :key="i" class="reason-tag">
            {{ reason }}
          </span>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.controls {
  margin: 2rem 0;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
}

.control-group {
  margin-bottom: 1rem;
}

.score-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--color-border);
  outline: none;
  -webkit-appearance: none;
}

.score-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
}

.stats {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading, .no-matches {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.match-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.match-rank {
  font-weight: 600;
  color: var(--color-text-light);
}

.match-score {
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.score-high {
  background: #d1fae5;
  color: #065f46;
}

.score-medium {
  background: #fef3c7;
  color: #92400e;
}

.score-low {
  background: #fee2e2;
  color: #991b1b;
}

.score-very-low {
  background: #f3f4f6;
  color: #374151;
}

.match-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 768px) {
  .match-content {
    grid-template-columns: 1fr;
  }
  
  .match-arrow {
    transform: rotate(90deg);
    justify-self: center;
  }
}

.item-column {
  padding: 1rem;
  border-radius: 6px;
  background: var(--color-background-soft);
}

.item-column h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-light);
}

.item-column.lost h3 {
  color: var(--color-error);
}

.item-column.found h3 {
  color: var(--color-success);
}

.item-description {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.item-location {
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.match-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--color-text-light);
  padding: 0.5rem;
}

.match-reasons {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.reason-tag {
  display: inline-block;
  margin: 0.25rem 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
  font-size: 0.8rem;
}
</style>