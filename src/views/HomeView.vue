<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { 
  Search, 
  PlusCircle, 
  HeartHandshake, 
  Layers, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Headphones,
  KeyRound,
  Shirt,
  Watch,
  ShoppingBag,
  FileText
} from 'lucide-vue-next'

const categories = [
  { 
    name: 'Electronics', 
    icon: Headphones, 
    desc: 'Laptops, Earbuds, Chargers',
    bgClass: 'cat-icon-electronics'
  },
  { 
    name: 'Keys', 
    icon: KeyRound, 
    desc: 'Keychains, Fobs, Lanyards',
    bgClass: 'cat-icon-keys'
  },
  { 
    name: 'Clothing', 
    icon: Shirt, 
    desc: 'Jackets, Hoodies, Hats',
    bgClass: 'cat-icon-clothing'
  },
  { 
    name: 'Accessories', 
    icon: Watch, 
    desc: 'Watches, Jewelry, Glasses',
    bgClass: 'cat-icon-accessories'
  },
  { 
    name: 'Bags', 
    icon: ShoppingBag, 
    desc: 'Backpacks, Wallets, Pouches',
    bgClass: 'cat-icon-bags'
  },
  { 
    name: 'Documents', 
    icon: FileText, 
    desc: 'IDs, Passports, Notebooks',
    bgClass: 'cat-icon-documents'
  }
]
</script>

<template>
  <main class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <!-- Headline -->
        <h1 class="hero-title">
          Reuniting Lost Belongings with <span class="gradient-text">Intelligent Precision</span>
        </h1>

        <!-- Subtitle -->
        <p class="hero-subtitle">
          Lost something around campus or found an item? Boomerang compares descriptions, locations, time windows, and physical attributes to match lost and found reports automatically.
        </p>

        <!-- CTA Action Cards Grid -->
        <div class="hero-cta-grid">
          <RouterLink to="/lost" class="cta-card cta-lost card card-elevated">
            <div class="cta-icon-box lost">
              <PlusCircle class="icon-lg" />
            </div>
            <div class="cta-content">
              <h3>I Lost Something</h3>
              <p>File a report & scan for matching found items</p>
            </div>
            <ArrowRight class="cta-arrow" />
          </RouterLink>

          <RouterLink to="/found" class="cta-card cta-found card card-elevated">
            <div class="cta-icon-box found">
              <HeartHandshake class="icon-lg" />
            </div>
            <div class="cta-content">
              <h3>I Found an Item</h3>
              <p>Report a found item to reunite it with its owner</p>
            </div>
            <ArrowRight class="cta-arrow" />
          </RouterLink>

          <RouterLink to="/matches" class="cta-card cta-matches card card-elevated">
            <div class="cta-icon-box matches">
              <Layers class="icon-lg" />
            </div>
            <div class="cta-content">
              <h3>Explore Matches</h3>
              <p>Browse live confidence scores & paired items</p>
            </div>
            <ArrowRight class="cta-arrow" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- How it Works Section -->
    <section class="workflow-section">
      <div class="section-header">
        <h2>How Boomerang Works</h2>
        <p>A simple 3-step automated matching pipeline designed for fast campus reunions.</p>
      </div>

      <div class="steps-grid">
        <div class="step-card card card-elevated">
          <div class="step-num">01</div>
          <div class="step-icon-bg">
            <Search class="step-icon" />
          </div>
          <h3>1. Submit Item Report</h3>
          <p>Provide details like category, description, date, color, brand, and exact location.</p>
        </div>

        <div class="step-card card card-elevated">
          <div class="step-num">02</div>
          <div class="step-icon-bg">
            <Zap class="step-icon" />
          </div>
          <h3>2. Multi-Factor Scoring</h3>
          <p>The algorithm scores category matches, date proximity, location keywords, and textual similarity.</p>
        </div>

        <div class="step-card card card-elevated">
          <div class="step-num">03</div>
          <div class="step-icon-bg">
            <CheckCircle2 class="step-icon" />
          </div>
          <h3>3. Safe Verification</h3>
          <p>Review match scores, verify distinguishing features, and contact the finder/owner securely.</p>
        </div>
      </div>
    </section>

    <!-- Supported Categories Grid -->
    <section class="categories-section">
      <div class="section-header">
        <h2>Supported Categories</h2>
        <p>Smart classification tailored for items commonly misplaced around campus.</p>
      </div>

      <div class="categories-grid">
        <div 
          v-for="cat in categories" 
          :key="cat.name" 
          class="category-card card card-elevated"
        >
          <div class="cat-icon-bg" :class="cat.bgClass">
            <component :is="cat.icon" class="cat-icon" />
          </div>
          <div class="cat-info">
            <h4 class="cat-name">{{ cat.name }}</h4>
            <p class="cat-desc">{{ cat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Callout Banner -->
    <section class="callout-card card">
      <div class="callout-content">
        <Sparkles class="callout-icon" />
        <div>
          <h2>Looking for a misplaced item?</h2>
          <p>Check our live matches or submit a report in under 2 minutes.</p>
        </div>
      </div>
      <div class="callout-actions">
        <RouterLink to="/matches" class="btn btn-primary btn-lg">
          <Layers class="icon-sm" />
          View Live Matches
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem 6rem;
  display: flex;
  flex-direction: column;
  gap: 5rem;
}

/* Hero Section */
.hero-section {
  text-align: center;
}

.hero-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-title {
  margin-bottom: 1.25rem;
}

.hero-subtitle {
  font-size: 1.15rem;
  max-width: 720px;
  margin: 0 auto 3rem;
  line-height: 1.7;
}

/* Hero CTA Cards Grid */
.hero-cta-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.cta-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  text-decoration: none;
  text-align: left;
  position: relative;
  overflow: hidden;
  border: none !important;
  box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.05);
}

.cta-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cta-icon-box.lost { background-color: var(--lost-bg); color: var(--lost-500); border: 1px solid var(--lost-border); }
.cta-icon-box.found { background-color: var(--found-bg); color: var(--found-500); border: 1px solid var(--found-border); }
.cta-icon-box.matches { background-color: var(--primary-light); color: var(--primary-500); border: 1px solid var(--primary-border); }

.cta-content h3 {
  font-size: 1.15rem;
  margin-bottom: 0.2rem;
}

.cta-content p {
  font-size: 0.85rem;
}

.cta-arrow {
  width: 20px;
  height: 20px;
  margin-left: auto;
  color: var(--text-dim);
  transition: transform 0.2s ease, color 0.2s ease;
}

.cta-card:hover .cta-arrow {
  transform: translateX(4px);
  color: var(--primary-600);
}

.icon-lg {
  width: 24px;
  height: 24px;
}

/* Workflow Section */
.workflow-section {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.section-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto;
}

.section-header h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.75rem;
}

.step-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 2rem;
}

.step-num {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--border-card);
  line-height: 1;
}

.step-icon-bg {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: var(--primary-light);
  border: 1px solid var(--primary-border);
  color: var(--primary-600);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.step-icon {
  width: 24px;
  height: 24px;
}

.step-card h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.step-card p {
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Categories Grid */
.categories-section {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
}

.cat-icon-bg {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid transparent;
}

.cat-icon {
  width: 22px;
  height: 22px;
}

.cat-icon-electronics {
  background-color: #eef2ff;
  border-color: #c7d2fe;
  color: #4f46e5;
}

.cat-icon-keys {
  background-color: #fffbeb;
  border-color: #fde68a;
  color: #d97706;
}

.cat-icon-clothing {
  background-color: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}

.cat-icon-accessories {
  background-color: #faf5ff;
  border-color: #e9d5ff;
  color: #9333ea;
}

.cat-icon-bags {
  background-color: #ecfdf5;
  border-color: #a7f3d0;
  color: #059669;
}

.cat-icon-documents {
  background-color: #ecfeff;
  border-color: #a5f3fc;
  color: #0891b2;
}

.cat-name {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.cat-desc {
  font-size: 0.8rem;
}

/* Callout Card */
.callout-card {
  padding: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  background: linear-gradient(135deg, #ffffff 0%, #eef2ff 100%);
  border: 1px solid var(--primary-border);
  box-shadow: var(--shadow-md);
  flex-wrap: wrap;
}

.callout-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.callout-icon {
  width: 44px;
  height: 44px;
  color: var(--primary-500);
  flex-shrink: 0;
}

.callout-content h2 {
  font-size: 1.6rem;
  margin-bottom: 0.25rem;
}

.icon-sm { width: 16px; height: 16px; }

@media (max-width: 768px) {
  .callout-card {
    flex-direction: column;
    text-align: center;
  }

  .callout-content {
    flex-direction: column;
  }
}
</style>