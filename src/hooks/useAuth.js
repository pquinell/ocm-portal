'use client';

import { useReducer, useEffect, useCallback, createContext, useContext } from 'react';

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
    CodeMismatchException:     'Invalid verification code.',
    ExpiredCodeException:      'Verification code has expired. Please request a new one.',
    InvalidPasswordException:  'Password does not meet requirements.',
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

// ── Reducer ───────────────────────────────────────────────────────────────────

function authReducer(state, action) {
  switch (action.type) {
    case 'resolve': return { token: action.token ?? null, isLoading: false };
    case 'set_token': return { ...state, token: action.token };
    default: return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initial state always matches server render — sessionStorage hydrated in useEffect.
  const [{ token, isLoading }, dispatch] = useReducer(authReducer, { token: null, isLoading: true });

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    const refresh = sessionStorage.getItem(REFRESH_KEY);

    if (stored && !isExpired(stored)) {
      dispatch({ type: 'resolve', token: stored });
      return;
    }

    if (refresh) {
      cognitoRequest('InitiateAuth', {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: refresh },
      }).then((data) => {
        const newToken = data.AuthenticationResult.IdToken;
        sessionStorage.setItem(TOKEN_KEY, newToken);
        dispatch({ type: 'resolve', token: newToken });
      }).catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_KEY);
        dispatch({ type: 'resolve', token: null });
      });
      return;
    }

    dispatch({ type: 'resolve', token: null });
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
    const idToken    = data.AuthenticationResult.IdToken;
    const refreshTok = data.AuthenticationResult.RefreshToken;
    sessionStorage.setItem(TOKEN_KEY, idToken);
    sessionStorage.setItem(REFRESH_KEY, refreshTok);
    dispatch({ type: 'set_token', token: idToken });
    return idToken;
  }, []);

  const forgotPassword = useCallback(async (email) => {
    await cognitoRequest('ForgotPassword', {
      ClientId: CLIENT_ID,
      Username: email,
    });
  }, []);

  const confirmForgotPassword = useCallback(async (email, code, newPassword) => {
    await cognitoRequest('ConfirmForgotPassword', {
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    dispatch({ type: 'set_token', token: null });
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut, signUp, confirmSignUp, resendCode, forgotPassword, confirmForgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}