<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { RotateCcw, Home, PlusCircle, HeartHandshake, Layers, ShieldCheck } from 'lucide-vue-next'

const route = useRoute()
</script>

<template>
  <div class="app-layout">
    <!-- Top Glass Navigation Bar -->
    <header class="top-nav">
      <div class="nav-container">
        <!-- Brand Logo -->
        <RouterLink to="/" class="brand-logo">
          <div class="logo-icon-bg">
            <RotateCcw class="logo-icon" />
          </div>
          <div class="brand-text">
            <span class="brand-title">Boomerang<span class="dot">.</span></span>
            <span class="brand-subtitle">Campus Lost & Found Matcher</span>
          </div>
        </RouterLink>

        <!-- Navigation Menu -->
        <nav class="nav-menu">
          <RouterLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
            <Home class="nav-icon" />
            <span>Home</span>
          </RouterLink>

          <RouterLink to="/lost" class="nav-item nav-item-lost" :class="{ active: route.path === '/lost' }">
            <PlusCircle class="nav-icon" />
            <span>Report Lost</span>
          </RouterLink>

          <RouterLink to="/found" class="nav-item nav-item-found" :class="{ active: route.path === '/found' }">
            <HeartHandshake class="nav-icon" />
            <span>Report Found</span>
          </RouterLink>

          <RouterLink to="/matches" class="nav-item nav-item-matches" :class="{ active: route.path === '/matches' }">
            <Layers class="nav-icon" />
            <span>View Matches</span>
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main View Content -->
    <div class="main-content-wrapper">
      <RouterView v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>

    <!-- App Footer -->
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-left">
          <div class="footer-brand">
            <RotateCcw class="icon-sm text-primary" />
            <span>Boomerang Matcher</span>
          </div>
          <p class="footer-sub">Reuniting students with lost belongings through automated similarity scoring.</p>
        </div>

        <div class="footer-right">
          <div class="security-chip">
            <ShieldCheck class="icon-xs" />
            <span>Verified Assessment Solution</span>
          </div>
          <p class="copyright">&copy; {{ new Date().getFullYear() }} Boomerang Lost & Found. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Top Sticky Navigation Bar */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-card);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Brand Logo */
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  text-decoration: none;
}

.logo-icon-bg {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-500) 0%, #06b6d4 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: transform 0.2s ease;
}

.brand-logo:hover .logo-icon-bg {
  transform: rotate(-15deg) scale(1.05);
}

.logo-icon {
  width: 22px;
  height: 22px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1;
}

.brand-title .dot {
  color: var(--primary-500);
}

.brand-subtitle {
  font-size: 0.725rem;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Navigation Menu */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--bg-subtle);
  padding: 0.35rem;
  border-radius: 9999px;
  border: 1px solid var(--border-card);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-icon {
  width: 16px;
  height: 16px;
}

.nav-item:hover {
  color: var(--text-main);
  background-color: rgba(255, 255, 255, 0.6);
}

.nav-item.active {
  color: var(--primary-600);
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.nav-item-lost.active {
  color: var(--lost-600);
}

.nav-item-found.active {
  color: var(--found-600);
}

.match-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.45rem;
  background: linear-gradient(135deg, var(--primary-500) 0%, #06b6d4 100%);
  color: #ffffff;
  border-radius: 6px;
  font-weight: 800;
}

/* Header Status Pill */
.header-status {
  display: flex;
  align-items: center;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  background-color: var(--found-bg);
  border: 1px solid var(--found-border);
  border-radius: 9999px;
  font-size: 0.775rem;
  color: var(--found-600);
  font-weight: 700;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--found-500);
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* Main Content */
.main-content-wrapper {
  flex: 1;
  width: 100%;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Footer */
.app-footer {
  background-color: #ffffff;
  border-top: 1px solid var(--border-card);
  padding: 2rem 1.5rem;
  margin-top: 4rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.footer-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.footer-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
}

.security-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.775rem;
  color: var(--primary-600);
  background-color: var(--primary-light);
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  border: 1px solid var(--primary-border);
  font-weight: 600;
}

.copyright {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.text-primary { color: var(--primary-500); }
.icon-xs { width: 14px; height: 14px; }
.icon-sm { width: 16px; height: 16px; }

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-status {
    display: none;
  }

  .footer-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-right {
    align-items: flex-start;
  }
}
</style>