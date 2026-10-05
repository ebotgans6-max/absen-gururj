import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  updatePhoneNumber,
} from 'firebase/auth';
import { auth, isRealFirebaseConfigured } from './config';
import { normalizePhone } from '../data/initialData';

// Convert local Indonesian phone (08xxx) to E.164 (+628xxx)
export const formatToE164 = (phone) => {
  const norm = normalizePhone(phone);
  if (norm.startsWith('0')) {
    return '+62' + norm.slice(1);
  }
  if (norm.startsWith('62')) {
    return '+' + norm;
  }
  return '+62' + norm;
};

// Lifecycle: Clear any existing reCAPTCHA instance cleanly
export const clearRecaptchaVerifier = () => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.warn('Warning clearing recaptchaVerifier:', e);
    }
    window.recaptchaVerifier = null;
  }
};

// Lifecycle: Initialize invisible reCAPTCHA verifier bound to target container element
export const createRecaptchaVerifier = (containerId = 'recaptcha-container', onCallback) => {
  clearRecaptchaVerifier();

  const element = document.getElementById(containerId);
  if (!element) {
    console.warn(`reCAPTCHA container element #${containerId} not found in DOM.`);
    return null;
  }

  try {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        if (typeof onCallback === 'function') onCallback();
      },
      'expired-callback': () => {
        clearRecaptchaVerifier();
      },
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  } catch (error) {
    console.warn('reCAPTCHA setup warning:', error);
    return null;
  }
};

// Legacy helper for backward compatibility
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  if (window.recaptchaVerifier) return window.recaptchaVerifier;
  return createRecaptchaVerifier(containerId);
};

// 1. Send OTP via Firebase Phone Auth (to current phone or any phone) with simulated fallback
export const sendOTP = async (phoneNumber, containerId = 'recaptcha-container') => {
  const e164 = formatToE164(phoneNumber);

  if (isRealFirebaseConfigured()) {
    try {
      const appVerifier = createRecaptchaVerifier(containerId);
      if (appVerifier) {
        await appVerifier.render();
      }
      const confirmationResult = await signInWithPhoneNumber(auth, e164, appVerifier);
      return {
        success: true,
        isRealFirebase: true,
        confirmationResult,
        message: `Kode OTP SMS resmi Firebase telah dikirimkan ke nomor ${phoneNumber}.`,
      };
    } catch (error) {
      console.warn('Firebase Phone Auth API error, falling back to OTP simulator:', error);
    }
  }

  // Generate simulated 6-digit OTP for testing & development
  const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    success: true,
    isRealFirebase: false,
    otpCode: simulatedCode,
    message: `[Simulasi SMS OTP] Kode verifikasi Anda adalah: ${simulatedCode}. Masukkan kode 6 digit ini untuk melanjutkan.`,
  };
};

// 2. Send OTP to NEW phone number specifically for Firebase updatePhoneNumber flow
export const sendNewPhoneUpdateOTP = async (newPhoneNumber, containerId = 'recaptcha-profile-container') => {
  const e164 = formatToE164(newPhoneNumber);

  if (isRealFirebaseConfigured()) {
    try {
      const appVerifier = createRecaptchaVerifier(containerId);
      if (appVerifier) {
        await appVerifier.render();
      }

      if (auth.currentUser) {
        const phoneProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneProvider.verifyPhoneNumber(e164, appVerifier);
        return {
          success: true,
          isRealFirebase: true,
          verificationId,
          mode: 'phoneProvider',
          message: `Kode OTP SMS telah dikirimkan ke nomor baru Anda: ${newPhoneNumber}.`,
        };
      } else {
        const confirmationResult = await signInWithPhoneNumber(auth, e164, appVerifier);
        return {
          success: true,
          isRealFirebase: true,
          confirmationResult,
          mode: 'signIn',
          message: `Kode OTP SMS telah dikirimkan ke nomor baru Anda: ${newPhoneNumber}.`,
        };
      }
    } catch (error) {
      console.warn('Firebase updatePhoneNumber OTP API error, using simulator:', error);
    }
  }

  const simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    success: true,
    isRealFirebase: false,
    otpCode: simulatedCode,
    message: `[Simulasi SMS OTP] Kode verifikasi untuk nomor baru ${newPhoneNumber} adalah: ${simulatedCode}. Masukkan kode ini untuk mengonfirmasi penggantian nomor HP.`,
  };
};

// 3. Verify OTP for standard flow (e.g. Change Password / Forgot Password)
export const verifyOTP = async (inputOtp, confirmationResult, simulatedOtp) => {
  const code = (inputOtp || '').trim();

  // If we have a Firebase confirmationResult from real SMS
  if (confirmationResult && typeof confirmationResult.confirm === 'function') {
    try {
      const userCredential = await confirmationResult.confirm(code);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: 'Kode OTP yang dimasukkan tidak valid atau sudah kedaluwarsa.' };
    }
  }

  // Verify against simulated OTP
  if (simulatedOtp && code === simulatedOtp.trim()) {
    return { success: true, isSimulated: true };
  }

  return { success: false, error: 'Kode OTP salah. Silakan periksa kembali kode 6 digit yang dikirimkan.' };
};

// 4. Verify OTP and execute Firebase updatePhoneNumber flow
export const verifyNewPhoneUpdateOTP = async ({
  inputOtp,
  verificationId,
  confirmationResult,
  simulatedOtp,
}) => {
  const code = (inputOtp || '').trim();

  // Mode 1: Firebase PhoneAuthProvider with verificationId on currentUser
  if (verificationId && auth.currentUser) {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, code);
      await updatePhoneNumber(auth.currentUser, cred);
      return { success: true, updatedOnFirebase: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Kode OTP verifikasi nomor baru salah atau sudah kedaluwarsa.',
      };
    }
  }

  // Mode 2: Firebase confirmationResult
  if (confirmationResult && typeof confirmationResult.confirm === 'function') {
    try {
      const userCredential = await confirmationResult.confirm(code);
      return { success: true, user: userCredential.user, updatedOnFirebase: true };
    } catch (error) {
      return {
        success: false,
        error: 'Kode OTP verifikasi nomor baru salah atau sudah kedaluwarsa.',
      };
    }
  }

  // Mode 3: Simulated OTP
  if (simulatedOtp && code === simulatedOtp.trim()) {
    return { success: true, isSimulated: true };
  }

  return {
    success: false,
    error: 'Kode OTP salah. Silakan periksa kembali 6 digit kode yang dikirim ke nomor baru Anda.',
  };
};
