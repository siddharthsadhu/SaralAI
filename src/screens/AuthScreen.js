import { navigate } from '../router.js';
import { getIcon } from '../icons.js';
import { signInWithGoogle } from '../api.js';

export function AuthScreen() {
  return `
    <div class="screen auth-screen">
      <div class="screen-content screen-center">
        <div class="auth-content animate-fadeIn">
          <div class="auth-icon circle-icon float">
            ${getIcon('user', 'icon')}
          </div>
          <h2 class="auth-title">Welcome to SaralAI</h2>
          <p class="auth-subtitle">Please sign in to access personalized government schemes and services.</p>
          
          <div class="auth-buttons">
            <div id="googleSignInDiv"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initAuthScreen() {
  // Initialize Google Login
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.warn("VITE_GOOGLE_CLIENT_ID is not configured in .env.local");
  }

  if (window.google) {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large", width: 280 }
      );
      window.google.accounts.id.prompt();
    } catch (e) {
      console.error("Failed to initialize Google Auth", e);
    }
  } else {
    setTimeout(initAuthScreen, 500); // Retry if script not loaded yet
  }
}

async function handleCredentialResponse(response) {
  try {
    window.SaralAI.showLoading();
    // Send the token to the backend
    const data = await signInWithGoogle(response.credential);
    
    // Store access token
    if (data && data.access_token) {
        localStorage.setItem('saralai_token', data.access_token);
        localStorage.setItem('saralai_user', JSON.stringify(data.user));
        window.SaralAI.showToast('Successfully signed in!');
        navigate('interactionmode'); // Or wherever you want them to go
    }
  } catch (error) {
    console.error("Login Error:", error);
    window.SaralAI.showToast('Failed to sign in.');
  } finally {
    window.SaralAI.hideLoading();
  }
}

export const authStyles = `
.auth-screen {
  background: var(--color-background);
}
.auth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
  width: 100%;
  padding: var(--space-8);
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}
.auth-icon {
  width: 64px;
  height: 64px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
}
.auth-icon .icon {
  width: 32px;
  height: 32px;
}
.auth-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
}
.auth-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
}
.auth-buttons {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-6);
  min-height: 50px;
}
`;
