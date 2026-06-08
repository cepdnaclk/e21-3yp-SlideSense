const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed. Please check your credentials.');
  }

  const data = await response.json();
  // Assuming backend returns { accessToken, refreshToken, user: { role } } or similar.
  // The Spring backend AuthController actually returns AuthResponse(accessToken, refreshToken, user).
  
  if (data.accessToken) {
    localStorage.setItem('AUTH_TOKEN', data.accessToken);
    
    if (data.user && data.user.role) {
      localStorage.setItem('USER_ROLE', data.user.role.toLowerCase());
    }
  }

  return data;
}

export async function register(registrationData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registrationData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Registration failed. Please check your inputs.');
  }

  return response.json();
}

export function logout() {
  localStorage.removeItem('AUTH_TOKEN');
  localStorage.removeItem('USER_ROLE');
}

export function getToken() {
  return localStorage.getItem('AUTH_TOKEN');
}
