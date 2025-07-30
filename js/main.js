// main.js - General UI and animation logic for MelodyCloud
// Smooth page transitions, glassmorphism effects, and button animations
// Example: Animate buttons on hover

// Dark theme toggle logic for all pages
function setTheme(dark) {
  const body = document.body;
  const toggleBtn = document.getElementById('theme-toggle');
  if (dark) {
    body.classList.add('dark-theme');
    if (toggleBtn) {
      toggleBtn.querySelector('i').classList.remove('fa-moon');
      toggleBtn.querySelector('i').classList.add('fa-sun');
    }
  } else {
    body.classList.remove('dark-theme');
    if (toggleBtn) {
      toggleBtn.querySelector('i').classList.remove('fa-sun');
      toggleBtn.querySelector('i').classList.add('fa-moon');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn, .logout-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.classList.add('btn-animate'));
    btn.addEventListener('mouseleave', () => btn.classList.remove('btn-animate'));
  });
  // Add more UI/UX magic here as needed
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = !document.body.classList.contains('dark-theme');
      setTheme(isDark);
      localStorage.setItem('melodycloud_theme', isDark ? 'dark' : 'light');
    });
    setTheme(localStorage.getItem('melodycloud_theme') === 'dark');
  }
}); 