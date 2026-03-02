/* ═══════════════════════════════════════
   AUTH.JS — Gestion connexion globale
═══════════════════════════════════════ */

async function checkAuth() {
  try {
    const res  = await fetch("/api/auth/status", { credentials: "include" });
    const data = await res.json();
    return data;
  } catch {
    return { logged: false };
  }
}

async function initAuth() {
  const zone = document.getElementById("authZone");
  if (!zone) return;

  const { logged, user } = await checkAuth();

  if (logged && user) {
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    zone.innerHTML = `
      <a href="/dashboard.html" class="auth-user-btn">
        <img class="auth-avatar" src="${avatarUrl}" alt="${user.username}"/>
        <span class="auth-username">${user.username}</span>
        <span class="auth-dashboard-label">Dashboard →</span>
      </a>`;
  } else {
    zone.innerHTML = `
      <a href="/auth/login" class="btn-login-discord">
        <svg width="18" height="18" viewBox="0 0 71 55" fill="none">
          <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a40.8 40.8 0 0 0-1.8 3.7
            a54 54 0 0 0-16.3 0A39.7 39.7 0 0 0 25.6.4 58.4 58.4 0 0 0 11 4.9
            C1.6 19-1 32.7.3 46.2a58.8 58.8 0 0 0 17.9 9 44.2 44.2 0 0 0
            3.8-6.2 38.3 38.3 0 0 1-6-2.9l1.4-1.1a41.8 41.8 0 0 0 36.2 0
            l1.5 1.1a38.4 38.4 0 0 1-6 2.9 44 44 0 0 0 3.8 6.2
            A58.6 58.6 0 0 0 70.7 46.2C72 30.5 68.5 16.9 60.1 4.9Z
            M23.7 38.1c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2
            s6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Z
            m23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2
            s6.5 3.3 6.4 7.2c0 4-2.9 7.2-6.4 7.2Z"
            fill="currentColor"/>
        </svg>
        Se connecter
      </a>`;
  }
}

initAuth();