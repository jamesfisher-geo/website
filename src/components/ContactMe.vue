<template>
  <div class="contact-me">
    <h1>Contact Me</h1>
    <p>Feel free to reach out through any of the following platforms:</p>
    <div class="contact-links">
      <a href="https://github.com/jamesfisher-geo" target="_blank" rel="noopener noreferrer">
        <i class="fab fa-github"></i> GitHub
      </a>
      <a href="https://www.linkedin.com/in/james-fisher" target="_blank" rel="noopener noreferrer">
        <i class="fab fa-linkedin"></i> LinkedIn
      </a>
      <a href="mailto:jamesfisher.gis@gmail.com"> <i class="fas fa-envelope"></i> Email </a>
    </div>
  </div>
</template>

<style scoped>
.contact-me {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 30px;
}

.contact-links {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.contact-links a {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background-color: #f0f0f0;
  color: #333;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.contact-links a:hover {
  background-color: #e0e0e0;
}

.contact-links i {
  margin-right: 10px;
  font-size: 1.2em;
}
</style>
