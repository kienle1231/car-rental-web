import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';
import { googleLoginAPI } from '../services/api';

const GoogleAuthButton = ({ onSuccess, onError }) => {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const scriptId = 'google-identity-script';
    if (document.getElementById(scriptId)) {
      setReady(true);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!ready || !window.google?.accounts?.id || !buttonRef.current) return;
    if (initializedRef.current) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.('Missing Google Client ID');
      return;
    }

    initializedRef.current = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const { data } = await googleLoginAPI({ credential: response.credential });
          onSuccess?.(data);
        } catch (error) {
          onError?.(error?.response?.data?.message || 'Google login failed');
        }
      }
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 360
    });
  }, [ready, onSuccess, onError]);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      className="flex items-center justify-center gap-2 border border-white/10 rounded-2xl py-3 text-sm text-gray-200 hover:border-yellow-400/50 hover:text-yellow-200 transition relative"
      onClick={() => window.google?.accounts?.id?.prompt()}
    >
      <Chrome className="w-4 h-4" /> Continue with Google
      <span ref={buttonRef} className="absolute opacity-0 pointer-events-none" />
    </motion.button>
  );
};

export default GoogleAuthButton;
