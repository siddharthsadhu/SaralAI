/**
 * Microphone Button Component
 */
import { getIcon } from '../icons.js';

/**
 * Create a microphone button with pulse animation
 * @param {object} options
 * @param {boolean} options.isListening - Is currently listening
 * @param {string} options.size - 'sm' | 'md' | 'lg'
 * @param {string} options.id - Button ID
 * @returns {string} Mic button HTML
 */
export function MicButton(options = {}) {
     const { isListening = false, size = 'lg', id = 'mic-btn' } = options;

     const sizeClass = `mic-btn-${size}`;
     const listeningClass = isListening ? 'mic-btn-listening' : '';

     return `
    <div class="mic-btn-container ${sizeClass}">
      <div class="mic-btn-rings">
        <div class="mic-btn-ring mic-btn-ring-1"></div>
        <div class="mic-btn-ring mic-btn-ring-2"></div>
        <div class="mic-btn-ring mic-btn-ring-3"></div>
      </div>
      <button class="mic-btn ${listeningClass}" id="${id}" aria-label="Speak">
        ${getIcon('mic', 'icon')}
      </button>
    </div>
  `;
}

/**
 * Create a small inline mic button
 * @param {object} options
 * @param {string} options.id - Button ID
 * @param {string} options.text - Text label
 * @returns {string} Small mic button HTML
 */
export function MicButtonSmall(options = {}) {
     const { id = 'mic-btn-small', text = 'Tap to speak' } = options;

     return `
    <div class="mic-btn-inline">
      <button class="mic-btn mic-btn-sm" id="${id}" aria-label="Speak">
        ${getIcon('mic', 'icon')}
      </button>
      <span class="mic-btn-label">${text}</span>
    </div>
  `;
}

// Mic button styles
export const micButtonStyles = `
.mic-btn-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-btn-container.mic-btn-lg {
  width: 180px;
  height: 180px;
}

.mic-btn-container.mic-btn-md {
  width: 120px;
  height: 120px;
}

.mic-btn-container.mic-btn-sm {
  width: 80px;
  height: 80px;
}

.mic-btn-rings {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-btn-ring {
  position: absolute;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary-ring);
  animation: mic-pulse 2s ease-out infinite;
}

.mic-btn-ring-1 {
  width: 100%;
  height: 100%;
  animation-delay: 0s;
}

.mic-btn-ring-2 {
  width: 80%;
  height: 80%;
  animation-delay: 0.3s;
}

.mic-btn-ring-3 {
  width: 60%;
  height: 60%;
  animation-delay: 0.6s;
}

@keyframes mic-pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
}

.mic-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-full);
  color: var(--color-text-inverse);
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
}

.mic-btn-container.mic-btn-md .mic-btn {
  width: 70px;
  height: 70px;
}

.mic-btn-container.mic-btn-sm .mic-btn {
  width: 50px;
  height: 50px;
}

.mic-btn .icon {
  width: 32px;
  height: 32px;
}

.mic-btn-container.mic-btn-md .mic-btn .icon {
  width: 24px;
  height: 24px;
}

.mic-btn-container.mic-btn-sm .mic-btn .icon {
  width: 20px;
  height: 20px;
}

.mic-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(37, 99, 235, 0.4);
}

.mic-btn:active {
  transform: scale(0.98);
}

.mic-btn-listening {
  animation: mic-listening 1s ease-in-out infinite;
}

@keyframes mic-listening {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
  }
  50% {
    box-shadow: 0 6px 40px rgba(37, 99, 235, 0.5);
  }
}

.mic-btn-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.mic-btn-inline .mic-btn {
  width: 56px;
  height: 56px;
}

.mic-btn-inline .mic-btn .icon {
  width: 24px;
  height: 24px;
}

.mic-btn.mic-btn-sm {
  width: 56px;
  height: 56px;
}

.mic-btn-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
`;
