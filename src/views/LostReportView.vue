<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ITEM_CATEGORIES, type ItemCategory } from '@/types'
import { supabase } from '@/utils/supabase'

const router = useRouter()

const form = ref({
  description: '',
  category: '' as ItemCategory | '',
  color: '',
  brand: '',
  location: '',
  dateLost: '',
  contactEmail: '',
  contactPhone: '',
  additionalNotes: ''
})

const isSubmitting = ref(false)
const error = ref('')
const success = ref('')

const validateForm = (): boolean => {
  if (!form.value.description.trim()) {
    error.value = 'Please describe the item you lost'
    return false
  }
  if (!form.value.category) {
    error.value = 'Please select a category'
    return false
  }
  if (!form.value.location.trim()) {
    error.value = 'Please enter where you lost the item'
    return false
  }
  if (!form.value.dateLost) {
    error.value = 'Please enter when you lost the item'
    return false
  }
  if (!form.value.contactEmail.trim()) {
    error.value = 'Please enter your email address'
    return false
  }
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.contactEmail)) {
    error.value = 'Please enter a valid email address'
    return false
  }
  return true
}

const submitForm = async () => {
  error.value = ''
  success.value = ''
  
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    const { error: supabaseError } = await supabase
      .from('lost_items')
      .insert({
        description: form.value.description.trim(),
        category: form.value.category,
        color: form.value.color.trim() || null,
        brand: form.value.brand.trim() || null,
        location: form.value.location.trim(),
        date_lost: new Date(form.value.dateLost).toISOString(),
        contact_email: form.value.contactEmail.trim(),
        contact_phone: form.value.contactPhone.trim() || null,
        additional_notes: form.value.additionalNotes.trim() || null
      })
      .select()
      .single()
    
    if (supabaseError) {
      throw supabaseError
    }
    
    success.value = 'Your lost item report has been submitted successfully!'
    
    // Reset form after successful submission
    form.value = {
      description: '',
      category: '',
      color: '',
      brand: '',
      location: '',
      dateLost: '',
      contactEmail: '',
      contactPhone: '',
      additionalNotes: ''
    }
    
    // Redirect to matches page after a short delay
    setTimeout(() => {
      router.push('/matches')
    }, 2000)
    
  } catch (err: unknown) {
    console.error('Error submitting form:', err)
    error.value = err instanceof Error ? err.message : 'An error occurred while submitting your report'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main>
    <h1>Report Lost Item</h1>
    <p>Help us find your lost item by providing as much detail as possible.</p>
    
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
    
    <div v-if="success" class="alert alert-success">
      {{ success }}
    </div>
    
    <form @submit.prevent="submitForm" class="report-form">
      <div class="form-group">
        <label class="form-label" for="description">Item Description *</label>
        <textarea
          id="description"
          v-model="form.description"
          class="form-input"
          placeholder="Describe the item you lost in detail (e.g., black AirPods case with a sticker on it)"
          rows="3"
          required
        ></textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="category">Category *</label>
          <select
            id="category"
            v-model="form.category"
            class="form-input"
            required
          >
            <option value="">Select a category</option>
            <option v-for="cat in ITEM_CATEGORIES" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="color">Color</label>
          <input
            id="color"
            v-model="form.color"
            type="text"
            class="form-input"
            placeholder="e.g., black, red, blue"
          />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="brand">Brand</label>
          <input
            id="brand"
            v-model="form.brand"
            type="text"
            class="form-input"
            placeholder="e.g., Apple, Nike, Sony"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="location">Location Lost *</label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            class="form-input"
            placeholder="e.g., library, cafeteria, main quad"
            required
          />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="dateLost">Date Lost *</label>
          <input
            id="dateLost"
            v-model="form.dateLost"
            type="date"
            class="form-input"
            required
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="contactEmail">Email *</label>
          <input
            id="contactEmail"
            v-model="form.contactEmail"
            type="email"
            class="form-input"
            placeholder="your.email@example.com"
            required
          />
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label" for="contactPhone">Phone (Optional)</label>
        <input
          id="contactPhone"
          v-model="form.contactPhone"
          type="tel"
          class="form-input"
          placeholder="Your phone number"
        />
      </div>
      
      <div class="form-group">
        <label class="form-label" for="additionalNotes">Additional Notes</label>
        <textarea
          id="additionalNotes"
          v-model="form.additionalNotes"
          class="form-input"
          placeholder="Any other details that might help identify your item (e.g., distinguishing marks, contents)"
          rows="2"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Lost Item Report' }}
        </button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.report-form {
  margin-top: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  margin-top: 2rem;
}

.btn {
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>