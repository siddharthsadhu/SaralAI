/**
 * SaralAI - Main Application Entry Point
 * Voice-first AI assistant for government services
 */

// Import design system
import './styles/index.css';

// Import router
import { initRouter, onRouteChange, getCurrentRoute } from './router.js';

// Import screens
import { LandingScreen, initLandingScreen, landingStyles } from './screens/LandingScreen.js';
import { LanguageScreen, initLanguageScreen, languageStyles } from './screens/LanguageScreen.js';
import { InteractionModeScreen, initInteractionModeScreen, interactionModeStyles } from './screens/InteractionModeScreen.js';
import { SpeakScreen, initSpeakScreen, speakStyles } from './screens/SpeakScreen.js';
import { TypeScreen, initTypeScreen, typeStyles } from './screens/TypeScreen.js';
import { ListeningScreen, initListeningScreen, listeningStyles } from './screens/ListeningScreen.js';
import { ProcessingScreen, initProcessingScreen, processingStyles } from './screens/ProcessingScreen.js';
import { ExplanationScreen, initExplanationScreen, explanationStyles } from './screens/ExplanationScreen.js';
import { GuidanceScreen, initGuidanceScreen, guidanceStyles } from './screens/GuidanceScreen.js';
import { DocumentsScreen, initDocumentsScreen, documentsStyles } from './screens/DocumentsScreen.js';
import { ClarificationScreen, initClarificationScreen, clarificationStyles } from './screens/ClarificationScreen.js';
import { WhatNextScreen, initWhatNextScreen, whatNextStyles } from './screens/WhatNextScreen.js';

// Import component styles
import { headerStyles } from './components/Header.js';
import { buttonStyles } from './components/Button.js';
import { micButtonStyles } from './components/MicButton.js';
import { languageCardStyles } from './components/LanguageCard.js';
import { audioPlayerStyles } from './components/AudioPlayer.js';
import { progressStyles } from './components/ProgressIndicator.js';
import { checklistStyles } from './components/ChecklistItem.js';
import { stepCardStyles } from './components/StepCard.js';

// Screen mapping
const screens = {
  landing: { render: LandingScreen, init: initLandingScreen },
  language: { render: LanguageScreen, init: initLanguageScreen },
  interactionmode: { render: InteractionModeScreen, init: initInteractionModeScreen },
  speak: { render: SpeakScreen, init: initSpeakScreen },
  type: { render: TypeScreen, init: initTypeScreen },
  listening: { render: ListeningScreen, init: initListeningScreen },
  processing: { render: ProcessingScreen, init: initProcessingScreen },
  explanation: { render: ExplanationScreen, init: initExplanationScreen },
  guidance: { render: GuidanceScreen, init: initGuidanceScreen },
  documents: { render: DocumentsScreen, init: initDocumentsScreen },
  clarification: { render: ClarificationScreen, init: initClarificationScreen },
  whatnext: { render: WhatNextScreen, init: initWhatNextScreen }
};

// Get app container
const app = document.querySelector('#app');

/**
 * Inject all component and screen styles
 */
function injectStyles() {
  const allStyles = [
    // Component styles
    headerStyles,
    buttonStyles,
    micButtonStyles,
    languageCardStyles,
    audioPlayerStyles,
    progressStyles,
    checklistStyles,
    stepCardStyles,
    // Screen styles
    landingStyles,
    languageStyles,
    interactionModeStyles,
    speakStyles,
    typeStyles,
    listeningStyles,
    processingStyles,
    explanationStyles,
    guidanceStyles,
    documentsStyles,
    clarificationStyles,
    whatNextStyles,
    // Page transition styles
    pageTransitionStyles
  ].filter(Boolean).join('\n');

  const styleElement = document.createElement('style');
  styleElement.id = 'saralai-styles';
  styleElement.textContent = allStyles;
  document.head.appendChild(styleElement);
}

/**
 * Page transition styles
 */
const pageTransitionStyles = `
/* Page Transitions */
.screen {
  opacity: 0;
  transform: translateY(10px);
  animation: screenEnter 0.4s ease forwards;
}

@keyframes screenEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.screen-exit {
  animation: screenExit 0.2s ease forwards;
}

@keyframes screenExit {
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(247, 248, 250, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.loading-overlay.active {
  opacity: 1;
  pointer-events: all;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Focus improvements for accessibility */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Hover effects for interactive elements */
.card-interactive {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.card-interactive:hover {
  transform: translateY(-2px);
}

.card-interactive:active {
  transform: translateY(0);
}

/* Ripple effect for buttons */
.btn {
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.btn:active::after {
  width: 200%;
  height: 200%;
}

/* Stagger animation for lists */
.stagger-item {
  opacity: 0;
  transform: translateY(20px);
  animation: staggerIn 0.4s ease forwards;
}

.stagger-item:nth-child(1) { animation-delay: 0.05s; }
.stagger-item:nth-child(2) { animation-delay: 0.1s; }
.stagger-item:nth-child(3) { animation-delay: 0.15s; }
.stagger-item:nth-child(4) { animation-delay: 0.2s; }
.stagger-item:nth-child(5) { animation-delay: 0.25s; }
.stagger-item:nth-child(6) { animation-delay: 0.3s; }
.stagger-item:nth-child(7) { animation-delay: 0.35s; }
.stagger-item:nth-child(8) { animation-delay: 0.4s; }

@keyframes staggerIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse animation for mic button */
.mic-pulse {
  animation: micPulse 2s ease-in-out infinite;
}

@keyframes micPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(37, 99, 235, 0);
  }
}

/* Sound wave animation */
.sound-wave {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 24px;
}

.sound-wave-bar {
  width: 3px;
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 2px;
  animation: soundWave 1s ease-in-out infinite;
}

.sound-wave-bar:nth-child(1) { animation-delay: 0s; }
.sound-wave-bar:nth-child(2) { animation-delay: 0.1s; }
.sound-wave-bar:nth-child(3) { animation-delay: 0.2s; }
.sound-wave-bar:nth-child(4) { animation-delay: 0.3s; }
.sound-wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes soundWave {
  0%, 100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

/* Toast notifications */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: var(--color-text-primary);
  color: var(--color-text-inverse);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* Skeleton loading */
.skeleton {
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-border-light) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Glass morphism effect */
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Floating animation */
.float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Success checkmark animation */
.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: checkmarkCircle 0.6s ease-in-out forwards;
}

.checkmark-check {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmarkCheck 0.3s ease-in-out 0.6s forwards;
}

@keyframes checkmarkCircle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes checkmarkCheck {
  to {
    stroke-dashoffset: 0;
  }
}
`;

/**
 * Render a screen
 * @param {string} route - Route name
 */
function renderScreen(route) {
  const screen = screens[route];

  if (!screen) {
    console.warn(`Unknown route: ${route}`);
    renderScreen('landing');
    return;
  }

  // Add exit animation to current screen
  const currentScreen = app.querySelector('.screen');
  if (currentScreen) {
    currentScreen.classList.add('screen-exit');
  }

  // Render new screen after brief delay for exit animation
  setTimeout(() => {
    app.innerHTML = screen.render();
    screen.init();

    // Scroll to top on screen change
    window.scrollTo(0, 0);
  }, currentScreen ? 200 : 0);
}

/**
 * Initialize the application
 */
function init() {
  console.log('🚀 SaralAI initializing...');

  // Inject all styles
  injectStyles();

  // Add loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loadingOverlay);

  // Add toast container
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = 'toast';
  document.body.appendChild(toast);

  // Set up route change handler
  onRouteChange((route) => {
    console.log(`📍 Navigating to: ${route}`);
    renderScreen(route);
  });

  // Initialize router (this will trigger initial render)
  initRouter();

  console.log('✅ SaralAI ready!');
}

// Utility functions exposed globally for components
window.SaralAI = {
  showLoading: () => {
    document.getElementById('loading-overlay')?.classList.add('active');
  },
  hideLoading: () => {
    document.getElementById('loading-overlay')?.classList.remove('active');
  },
  showToast: (message, duration = 3000) => {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }
  }
};

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
