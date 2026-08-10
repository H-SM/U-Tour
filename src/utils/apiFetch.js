import { auth } from "../firebase/config";

// Wraps fetch() to call the server API, attaching the current Firebase
// user's ID token so requests pass the server's auth middleware.
export async function apiFetch(path, options = {}) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  return fetch(`${process.env.REACT_APP_API_URL}${path}`, {
    ...options,
    headers,
  });
}
