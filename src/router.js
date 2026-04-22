/**
 * Simple hash-based router for SaralAI
 */

const routes = {
  landing: 'landing',
  auth: 'auth',
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
  whatnext: 'whatnext',
  services: 'services',
  help: 'help'
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
  let route = hash.replace('/', '');

  // Auth Guard: Force login if not authenticated
  const publicRoutes = ['landing', 'auth'];
  if (!publicRoutes.includes(route)) {
    const token = localStorage.getItem('saralai_token');
    if (!token) {
      route = 'auth';
      window.location.hash = 'auth';
    }
  }

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
