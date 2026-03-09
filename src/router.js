/**
 * Simple hash-based router for SaralAI
 */

const routes = {
  landing: 'landing',
  language: 'language',
  interactionmode: 'interactionmode',
  speak: 'speak',
  type: 'type',
  listening: 'listening',
  processing: 'processing',
  explanation: 'explanation',
  guidance: 'guidance',
  documents: 'documents',
  clarification: 'clarification',
  whatnext: 'whatnext'
};

let currentRoute = null;
let onRouteChangeCallback = null;

/**
 * Initialize the router
 */
function initRouter() {
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

/**
 * Handle hash change events
 */
function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'landing';
  const route = hash.replace('/', '');

  if (route !== currentRoute) {
    currentRoute = route;
    if (onRouteChangeCallback) {
      onRouteChangeCallback(currentRoute);
    }
  }
}

/**
 * Navigate to a specific route
 * @param {string} route - The route name
 */
function navigate(route) {
  if (routes[route] !== undefined) {
    window.location.hash = route;
  } else {
    console.warn(`Unknown route: ${route}`);
  }
}

/**
 * Go back in history
 */
function goBack() {
  window.history.back();
}

/**
 * Register a callback for route changes
 * @param {Function} callback - Function to call when route changes
 */
function onRouteChange(callback) {
  onRouteChangeCallback = callback;
}

/**
 * Get the current route
 * @returns {string} Current route name
 */
function getCurrentRoute() {
  return currentRoute || 'landing';
}

export { routes, initRouter, navigate, goBack, onRouteChange, getCurrentRoute };
