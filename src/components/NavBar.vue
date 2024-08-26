<template>
  <div :class="['nav-container', { homepage: isHomePage }]">
    <div class="name-and-nav" :class="{ homepage: isHomePage }">
      <div class="name-text" :class="{ homepage: isHomePage }">James A. Fisher</div>
      <nav class="secondary-nav">
        <RouterLink v-if="!isHomePage" to="/">Home</RouterLink>
        <RouterLink to="/projects">Projects</RouterLink>
        <RouterLink to="/splats">Splats</RouterLink>
        <RouterLink to="/contactme">Contact Me</RouterLink>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isHomePage = computed(() => route.path === '/')
</script>

<style scoped>
.nav-container {
  position: relative;
  width: 100%;
}

/* Add this new class */
.name-and-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

/* Modify this class */
.name-text {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  white-space: nowrap;
  min-width: 150px;
}

/* Modify this class */
.name-and-nav.homepage {
  flex-direction: column;
  align-items: center;
}

/* Modify this class */
.name-text.homepage {
  margin-bottom: 20px;
  font-size: 24px;
}

.secondary-nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
}

.secondary-nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
  flex-shrink: 1;
}

.secondary-nav a:first-of-type {
  border: 0;
}

.secondary-nav a.router-link-active {
  color: var(--color-text);
}

.secondary-nav a.router-link-active:hover {
  background-color: transparent;
}

/* Modify this class */
.nav-container.homepage {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* Add this class */
.nav-container.homepage .name-and-nav {
  flex-direction: column;
  align-items: center;
}

.nav-container.homepage .secondary-nav a {
  display: block;
  padding: 0.5rem 1rem;
  border: none;
  margin: 0.5rem 0;
}

@media (min-width: 1024px) {
  .secondary-nav {
    font-size: 1rem;
  }

  .nav-container.homepage .secondary-nav {
    font-size: 1.5rem;
  }

  .name-text.homepage {
    font-size: 32px;
  }
}
</style>
