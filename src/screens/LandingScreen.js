/**
 * Landing Screen
 */
import { Button } from '../components/Button.js';
import { navigate } from '../router.js';
import { getIcon } from '../icons.js';

/**
 * Render landing screen
 * @returns {string} Screen HTML
 */
export function LandingScreen() {
  return `
    <div class="screen landing-screen">
      <div class="screen-content screen-center">
        <div class="landing-content animate-fadeIn">
          <div class="landing-icon">
            <div class="landing-icon-rings">
              <div class="landing-icon-ring landing-icon-ring-1"></div>
              <div class="landing-icon-ring landing-icon-ring-2"></div>
              <div class="landing-icon-ring landing-icon-ring-3"></div>
            </div>
            <div class="landing-icon-circle">
              ${getIcon('government', 'icon landing-icon-svg')}
            </div>
          </div>
          
          <h1 class="landing-title">
            A simple helper to<br>understand<br>government services
          </h1>
          
          <p class="landing-subtitle">
            Voice-first AI assistant
          </p>
          
          <div class="landing-action">
            ${Button({
    text: 'Start',
    variant: 'dark',
    size: 'lg',
    fullWidth: true,
    id: 'start-btn'
  })}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize landing screen events
 */
export function initLandingScreen() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      navigate('language');
    });
  }
}

// Landing screen styles
export const landingStyles = `
.landing-screen {
  background: linear-gradient(180deg, var(--color-bg) 0%, #F0F4FF 100%);
}

.landing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
  padding: var(--space-8);
}

.landing-icon {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-10);
}

.landing-icon-rings {
  position: absolute;
  inset: 0;
}

.landing-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary-ring);
  animation: landing-pulse 3s ease-out infinite;
}

.landing-icon-ring-1 {
  animation-delay: 0s;
}

.landing-icon-ring-2 {
  inset: 15px;
  animation-delay: 0.5s;
}

.landing-icon-ring-3 {
  inset: 30px;
  animation-delay: 1s;
}

@keyframes landing-pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.2;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.6;
  }
}

.landing-icon-circle {
  position: relative;
  z-index: 1;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-full);
  box-shadow: 0 10px 40px rgba(37, 99, 235, 0.3);
}

.landing-icon-svg {
  width: 40px;
  height: 40px;
  color: white;
}

.landing-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-4);
}

.landing-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-16);
}

.landing-action {
  width: 100%;
  max-width: 280px;
}
`;
