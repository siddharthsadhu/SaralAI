/**
 * Audio Player Component
 */
import { getIcon } from '../icons.js';

/**
 * Create an audio player placeholder
 * @param {object} options
 * @param {string} options.title - Player title
 * @param {string} options.subtitle - Player subtitle
 * @param {string} options.duration - Duration display
 * @param {string} options.currentTime - Current time display
 * @param {string} options.id - Player ID
 * @returns {string} Audio player HTML
 */
export function AudioPlayer(options = {}) {
     const {
          title = 'Listen to explanation',
          subtitle = 'AI Assistant • Hindi / English',
          duration = '1:15',
          currentTime = '0:42',
          id = 'audio-player'
     } = options;

     return `
    <div class="audio-player" id="${id}">
      <button class="audio-player-btn" id="${id}-play" aria-label="Play">
        ${getIcon('play', 'icon icon-lg')}
      </button>
      <div class="audio-player-content">
        <div class="audio-player-info">
          <span class="audio-player-title">${title}</span>
          <span class="audio-player-subtitle">${subtitle}</span>
        </div>
        <div class="audio-player-wave">
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
        </div>
      </div>
      <span class="audio-player-time">${currentTime} / ${duration}</span>
    </div>
  `;
}

// Audio player styles
export const audioPlayerStyles = `
.audio-player {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
}

.audio-player-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-full);
  color: var(--color-text-inverse);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.audio-player-btn:hover {
  background-color: var(--color-primary-dark);
  transform: scale(1.05);
}

.audio-player-btn .icon {
  width: 20px;
  height: 20px;
}

.audio-player-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.audio-player-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.audio-player-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.audio-player-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

.audio-player-wave {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 20px;
}

.wave-bar {
  width: 3px;
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 2px;
  animation: wave-animation 1s ease-in-out infinite;
}

.wave-bar:nth-child(1) { height: 40%; animation-delay: 0s; }
.wave-bar:nth-child(2) { height: 70%; animation-delay: 0.1s; }
.wave-bar:nth-child(3) { height: 50%; animation-delay: 0.2s; }
.wave-bar:nth-child(4) { height: 90%; animation-delay: 0.3s; }
.wave-bar:nth-child(5) { height: 60%; animation-delay: 0.4s; }
.wave-bar:nth-child(6) { height: 80%; animation-delay: 0.5s; }
.wave-bar:nth-child(7) { height: 40%; animation-delay: 0.6s; }
.wave-bar:nth-child(8) { height: 70%; animation-delay: 0.7s; }
.wave-bar:nth-child(9) { height: 30%; animation-delay: 0.8s; }
.wave-bar:nth-child(10) { height: 50%; animation-delay: 0.9s; }
.wave-bar:nth-child(11) { height: 20%; animation-delay: 1s; }
.wave-bar:nth-child(12) { height: 30%; animation-delay: 1.1s; }

@keyframes wave-animation {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.audio-player-time {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
}

@media (max-width: 480px) {
  .audio-player {
    flex-wrap: wrap;
  }
  
  .audio-player-time {
    width: 100%;
    text-align: center;
    margin-top: var(--space-2);
  }
}
`;
