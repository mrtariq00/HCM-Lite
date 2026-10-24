/* Lightweight, dependency-free visual interactions for the HCM Lite experience. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = () => {
    document.body.classList.add('experience-ready');
    revealSections();
    // Keep motion purposeful: reveal content as it enters view, but do not
    // distract HR users with decorative particles or cursor-following effects.
  };

  function revealSections() {
    const nodes = [...document.querySelectorAll('.stat,.panel,.attendance-card,.payslip,.auth-card')];
    nodes.forEach((node, index) => {
      node.classList.add('js-reveal');
      node.style.transitionDelay = `${Math.min(index * 45, 300)}ms`;
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    nodes.forEach(node => observer.observe(node));
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
})();
