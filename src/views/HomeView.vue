<script setup lang="ts">
</script>

<template>
  <main>
    <h1>Lost & Found Matcher</h1>
    <p>Help reunite people with their lost items</p>
    
    <div class="actions">
      <router-link to="/lost" class="action-card">
        <h2>Report Lost Item</h2>
        <p>Lost something? Let us know and we'll help find it.</p>
      </router-link>
      
      <router-link to="/found" class="action-card">
        <h2>Report Found Item</h2>
        <p>Found something? Help us reunite it with its owner.</p>
      </router-link>
      
      <router-link to="/matches" class="action-card">
        <h2>View Matches</h2>
        <p>See potential matches between lost and found items.</p>
      </router-link>
    </div>
  </main>
</template>

<style scoped>
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.action-card {
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.action-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-card h2 {
  margin: 0 0 0.5rem 0;
  color: var(--color-primary);
}

.action-card p {
  margin: 0;
  color: var(--color-text-light);
}
</style>