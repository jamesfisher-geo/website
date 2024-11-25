<template>
  <div :class="['nav-container', { homepage: isHomePage }]">
    <div class="name-and-nav" :class="{ homepage: isHomePage }">
      <div class="name-text" :class="{ homepage: isHomePage }">James A. Fisher</div>
      <div v-if="!isHomePage" class="menu-toggle" @click="toggleMenu">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <nav :class="['secondary-nav', { 'menu-open': isMenuOpen, homepage: isHomePage }]">
        <RouterLink v-if="!isHomePage" to="/" @click="closeMenu">Home</RouterLink>
        <RouterLink to="/splats" @click="closeMenu">3-D Journal</RouterLink>
        <RouterLink to="/contactme" @click="closeMenu">Contact Me</RouterLink>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { computed, ref } from 'vue'

const route = useRoute()
const isHomePage = computed(() => route.path === '/')
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<style scoped>
.nav-container {
  position: relative;
  width: 100%;
}

.name-and-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.name-text {
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 11;
}

.menu-toggle span {
  width: 30px;
  height: 3px;
  background: var(--color-text);
  transition: all 0.3s linear;
  position: relative;
  transform-origin: 1px;
}

.secondary-nav {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.secondary-nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

.secondary-nav a:first-of-type {
  border-left: none;
}

.secondary-nav a.router-link-active {
  color: var(--color-text);
  font-weight: bold;
}

/* Homepage specific styles */
.nav-container.homepage {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.name-and-nav.homepage {
  flex-direction: column;
  align-items: center;
}

.name-text.homepage {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
}

.secondary-nav.homepage {
  flex-direction: column;
  align-items: center;
}

.secondary-nav.homepage a {
  display: block;
  padding: 0.5rem 1rem;
  border-left: none;
  margin: 0.5rem 0;
  text-align: center;
}

@media (max-width: 768px) {
  .nav-container:not(.homepage) .menu-toggle {
    display: flex;
  }

  .nav-container:not(.homepage) .secondary-nav {
    position: absolute;
    flex-direction: column;
    right: 0;
    top: 100%;
    background-color: var(--color-background);
    width: 100%;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    z-index: 10;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .nav-container:not(.homepage) .secondary-nav.menu-open {
    max-height: 300px;
  }

  .nav-container:not(.homepage) .secondary-nav a {
    display: block;
    padding: 10px;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .nav-container:not(.homepage) .secondary-nav a:first-of-type {
    border-top: none;
  }

  .nav-container.homepage {
    min-height: 100vh;
    height: auto;
  }

  .name-and-nav.homepage {
    width: 100%;
  }

  .secondary-nav.homepage {
    width: 100%;
  }

  .secondary-nav.homepage a {
    width: 100%;
    padding: 10px 0;
  }
}

@media (min-width: 1024px) {
  .name-text {
    font-size: 24px;
  }

  .secondary-nav {
    font-size: 16px;
  }

  .nav-container.homepage .secondary-nav {
    font-size: 1.5rem;
  }

  .name-text.homepage {
    font-size: 32px;
  }
}
</style>
