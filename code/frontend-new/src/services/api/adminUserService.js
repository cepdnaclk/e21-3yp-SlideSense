import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

export async function getAllUsers() {
  return fetchWithAuth('/users');
}

export async function getCurrentUser() {
  return fetchWithAuth('/users/me');
}

export async function createUser(userData) {
  return fetchWithAuth('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(userId) {
  return fetchWithAuth(`/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function updateUserRole(userId, role) {
  return fetchWithAuth(`/users/${userId}/role?role=${role}`, {
    method: 'PUT',
  });
}

export async function getRegistrationRequests() {
  return fetchWithAuth('/admin/registration-requests?status=PENDING');
}

export async function approveRegistrationRequest(requestId, probeId, verificationNotes = '') {
  return fetchWithAuth(`/admin/registration-requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ verificationNotes, probeId }),
  });
}

export async function rejectRegistrationRequest(requestId, verificationNotes = '') {
  return fetchWithAuth(`/admin/registration-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ verificationNotes }),
  });
}
