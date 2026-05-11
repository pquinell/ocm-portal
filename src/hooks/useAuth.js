'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const REGION      = process.env.NEXT_PUBLIC_AWS_REGION      ?? 'ca-central-1';
const CLIENT_ID   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const TOKEN_KEY   = 'ocm_id_token';
const REFRESH_KEY = 'ocm_refresh_token';

// ── Cognito auth helpers ──────────────────────────────────────────────────────

async function cognitoRequest(target, body) {
  const res = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.__type) throw new Error(friendlyError(data.__type, data.message));
  return data;
}

function friendlyError(type, message) {
  const map = {
    NotAuthorizedException:    'Invalid email or password.',
    UserNotFoundException:     'No account found with that email.',
    UserNotConfirmedException: 'Please verify your email before signing in.',
    PasswordResetRequiredException: 'You must reset your password before signing in.',
    TooManyRequestsException:  'Too many attempts. Please wait a moment and try again.',
  };
  return map[type] ?? message ?? 'An unexpected error occurred.';
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isExpired(token) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - 60_000; // 1 min buffer
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored && !isExpired(stored)) {
      setToken(stored);
    } else {
      // Try to refresh
      const refresh = sessionStorage.getItem(REFRESH_KEY);
      if (refresh) {
        refreshToken(refresh).then(setToken).catch(() => {}).finally(() => setIsLoading(false));
        return;
      }
    }
    setIsLoading(false);
  }, []);

  async function refreshToken(refreshToken) {
    try {
      const data = await cognitoRequest('InitiateAuth', {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      });
      const newToken = data.AuthenticationResult.IdToken;
      sessionStorage.setItem(TOKEN_KEY, newToken);
      return newToken;
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      return null;
    }
  }

  const signIn = useCallback(async (email, password) => {
    const data = await cognitoRequest('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });
    const idToken      = data.AuthenticationResult.IdToken;
    const refreshTok   = data.AuthenticationResult.RefreshToken;
    sessionStorage.setItem(TOKEN_KEY, idToken);
    sessionStorage.setItem(REFRESH_KEY, refreshTok);
    setToken(idToken);
    return idToken;
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}