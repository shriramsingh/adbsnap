// ADBSnap Showcase Interactivity
document.addEventListener('DOMContentLoaded', () => {
  // Command Box Copy Functionality
  const copyBtns = document.querySelectorAll('.cmd-copy');
  copyBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          btn.style.color = '#10b981';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
          }, 2000);
        });
      }
    });
  });

  // Mockup Theme Selector Switcher
  const themeChips = document.querySelectorAll('.theme-chip');
  const previewImg = document.getElementById('preview-mockup-img');

  const themeImages = {
    hero: 'assets/hero.png',
    aurora: 'assets/aurora.png',
    showcase: 'assets/showcase.png',
  };

  themeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      themeChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const themeKey = chip.getAttribute('data-theme');
      if (themeImages[themeKey] && previewImg) {
        previewImg.style.opacity = '0.5';
        previewImg.style.transition = 'opacity 0.15s ease';
        setTimeout(() => {
          previewImg.src = themeImages[themeKey];
          previewImg.style.opacity = '1';
        }, 150);
      }
    });
  });
});
