/**
 * QuickJob Authentication Service Client
 * Handles REST API communication with the backend authentication and session system.
 */

export class AuthService {
  static async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      credentials: 'include' // include HttpOnly session cookies
    };

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.detail || data.message || `Anfrage fehlgeschlagen (${response.status})`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      throw new Error(`Netzwerkfehler: Server nicht erreichbar (${err.message})`);
    }
  }

  static async register({ email, password, password_confirmation, name, age, agb_accepted, agb_version = '1.1.0', role = 'worker' }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        password_confirmation,
        name,
        age: Number(age),
        agb_accepted: Boolean(agb_accepted),
        agb_version,
        role
      })
    });
  }

  static async login({ email, password, remember_me = true }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        remember_me: Boolean(remember_me)
      })
    });
  }

  static async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST'
    });
  }

  static async getSession() {
    return this.request('/api/auth/me', {
      method: 'GET'
    });
  }

  static async verifyEmail(token) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  static async resendVerification(email) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  static async forgotPassword(email) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  static async resetPassword({ token, new_password, new_password_confirmation }) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        new_password,
        new_password_confirmation
      })
    });
  }

  static async changePassword({ current_password, new_password, new_password_confirmation }) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password,
        new_password,
        new_password_confirmation
      })
    });
  }

  static async deleteAccount() {
    return this.request('/api/auth/account', {
      method: 'DELETE'
    });
  }

  static async getLatestDevEmail(recipient = null, templateType = null) {
    let url = '/api/dev/latest-email';
    const params = [];
    if (recipient) params.push(`recipient=${encodeURIComponent(recipient)}`);
    if (templateType) params.push(`template_type=${encodeURIComponent(templateType)}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.request(url, { method: 'GET' });
  }
}
