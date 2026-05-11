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
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem(TOKEN_KEY);
    return (stored && !isExpired(stored)) ? stored : null;
  });
  // isLoading is true only when we have a refresh token to attempt — avoids
  // synchronous setState calls inside the effect below
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored && !isExpired(stored)) return false;
    return !!sessionStorage.getItem(REFRESH_KEY);
  });

  // Resolve isLoading on mount: attempt a token refresh if needed, otherwise no-op
  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    const refresh = sessionStorage.getItem(REFRESH_KEY);

    const work = (!stored || isExpired(stored)) && refresh
      ? cognitoRequest('InitiateAuth', {
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: CLIENT_ID,
          AuthParameters: { REFRESH_TOKEN: refresh },
        }).then((data) => {
          const newToken = data.AuthenticationResult.IdToken;
          sessionStorage.setItem(TOKEN_KEY, newToken);
          setToken(newToken);
        }).catch(() => {
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(REFRESH_KEY);
        })
      : Promise.resolve();

    work.finally(() => setIsLoading(false));
  }, []);

  const signUp = useCallback(async (email, password) => {
    const data = await cognitoRequest('SignUp', {
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }],
    });
    return data;
  }, []);

  const confirmSignUp = useCallback(async (email, code) => {
    await cognitoRequest('ConfirmSignUp', {
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });
  }, []);

  const resendCode = useCallback(async (email) => {
    await cognitoRequest('ResendConfirmationCode', {
      ClientId: CLIENT_ID,
      Username: email,
    });
  }, []);

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
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut, signUp, confirmSignUp, resendCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}