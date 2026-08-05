/**
 * CinTic Dynamic Theme Module
 */

/**
 * Extracts the dominant color from an image using a canvas
 * @param {HTMLImageElement} img
 * @returns {Promise<string>} RGB color string
 */
export async function getDominantColor(img) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use a small canvas for performance
    canvas.width = 10;
    canvas.height = 10;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, 10, 10);

    // Get pixel data
    const { data } = ctx.getImageData(0, 0, 10, 10);

    let r = 0; let g = 0; let
      b = 0;
    const count = data.length / 4;

    // Average the colors
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    resolve(`rgb(${r}, ${g}, ${b})`);
  });
}

/**
 * Updates the CSS variables for the dynamic movie theme
 * @param {string} color
 */
export function updateTheme(color) {
  document.documentElement.style.setProperty('--movie-theme', color);
  // Also create a darker and lighter version
  const [r, g, b] = color.match(/\d+/g).map(Number);
  document.documentElement.style.setProperty('--movie-theme-muted', `rgba(${r}, ${g}, ${b}, 0.2)`);
  document.documentElement.style.setProperty('--movie-theme-glow', `rgba(${r}, ${g}, ${b}, 0.5)`);
}

/**
 * Set up IntersectionObserver for scroll animations
 */
export function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-reveal');
        // Unobserve after animating once
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Initial observation of movie cards
  document.querySelectorAll('.movie-card:not(.skeleton)').forEach((card) => {
    observer.observe(card);
  });

  // Export the observer to be used when new items are rendered
  return observer;
}
