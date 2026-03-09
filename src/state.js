/**
 * Simple state management for SaralAI
 */

const state = {
     selectedLanguage: 'en',
     languages: [
          { code: 'en', native: 'English', english: 'English' },
          { code: 'hi', native: 'हिंदी', english: 'Hindi' },
          { code: 'bn', native: 'বাংলা', english: 'Bengali' },
          { code: 'te', native: 'తెలుగు', english: 'Telugu' },
          { code: 'mr', native: 'मराठी', english: 'Marathi' },
          { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
          { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
          { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' }
     ],
     interactionMode: 'voice', // 'voice' or 'text'
     isListening: false,
     isProcessing: false,
     currentQuery: '',
     currentStep: 1,
     totalSteps: 3,
     // Query result state
     currentScheme: null,        // Full scheme object from Schemes.json
     currentIntent: null,        // 'OVERVIEW' | 'ELIGIBILITY' | 'DOCUMENTS' | 'STEPS'
     currentExplanation: null,   // Result from generateExplanation()
     topMatches: [],             // Ranked scheme matches (for clarification screen)
     queryHistory: []            // Previous queries this session
};

const listeners = new Set();

/**
 * Get the current state
 * @returns {object} Current state
 */
function getState() {
     return { ...state };
}

/**
 * Update state with new values
 * @param {object} updates - Partial state updates
 */
function setState(updates) {
     Object.assign(state, updates);
     notifyListeners();
}

/**
 * Subscribe to state changes
 * @param {Function} listener - Callback function
 * @returns {Function} Unsubscribe function
 */
function subscribe(listener) {
     listeners.add(listener);
     return () => listeners.delete(listener);
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
     listeners.forEach(listener => listener(getState()));
}

/**
 * Get selected language object
 * @returns {object} Selected language
 */
function getSelectedLanguage() {
     return state.languages.find(lang => lang.code === state.selectedLanguage) || state.languages[0];
}

/**
 * Set selected language
 * @param {string} code - Language code
 */
function setSelectedLanguage(code) {
     setState({ selectedLanguage: code });
}

export { getState, setState, subscribe, getSelectedLanguage, setSelectedLanguage };
