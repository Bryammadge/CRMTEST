import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface SoftPhoneProps {
  onCallStart?: (phoneNumber: string, callId: string) => void;
  onCallEnd?: (callId: string, duration: number) => void;
  autoDialNumber?: string;
}

export default function SoftPhone({ onCallStart, onCallEnd, autoDialNumber }: SoftPhoneProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState<string>('');
  const [currentCallId, setCurrentCallId] = useState<string>('');

  const timerRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // SIP Configuration (demo - in production, load from env variables)
  const sipConfig = {
    server: import.meta.env.VITE_SIP_WEBSOCKET_URL || 'wss://sip.example.com',
    domain: import.meta.env.VITE_SIP_DOMAIN || 'example.com',
    username: 'demo_agent', // Should be from user profile
    password: 'demo_password', // Should be from secure storage
  };

  useEffect(() => {
    // Auto-register on mount
    handleRegister();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-dial if number provided
    if (autoDialNumber && isRegistered && !isCalling) {
      setPhoneNumber(autoDialNumber);
      setTimeout(() => handleCall(), 500);
    }
  }, [autoDialNumber, isRegistered]);

  function handleRegister() {
    // In production, this would initialize JsSIP
    // const socket = new JsSIP.WebSocketInterface(sipConfig.server);
    // const configuration = {
    //   sockets: [socket],
    //   uri: `sip:${sipConfig.username}@${sipConfig.domain}`,
    //   password: sipConfig.password,
    // };
    // const ua = new JsSIP.UA(configuration);
    // ua.start();

    // Demo mode - simulate connection
    setCallStatus('Conectando al servidor SIP...');
    setTimeout(() => {
      setIsRegistered(true);
      setIsConnected(true);
      setCallStatus('Conectado y listo');
    }, 1000);
  }

  function handleCall() {
    if (!phoneNumber) {
      alert('Ingrese un número de teléfono');
      return;
    }

    setIsCalling(true);
    setCallStatus('Llamando...');
    const callId = `call_${Date.now()}`;
    setCurrentCallId(callId);
    startTimeRef.current = Date.now();

    // Notify parent component
    if (onCallStart) {
      onCallStart(phoneNumber, callId);
    }

    // In production, would use JsSIP to make actual call
    // session = ua.call(phoneNumber, options);
    // session.on('confirmed', () => { ... });
    // session.on('ended', () => { ... });

    // Demo mode - simulate call sequence
    setTimeout(() => {
      setCallStatus('Conectado');
      startCallTimer();
    }, 2000);
  }

  function startCallTimer() {
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setCallDuration(elapsed);
    }, 1000);
  }

  function handleHangup() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const duration = callDuration;

    // Notify parent component
    if (onCallEnd && currentCallId) {
      onCallEnd(currentCallId, duration);
    }

    // In production: session.terminate();

    setIsCalling(false);
    setCallDuration(0);
    setCallStatus('Llamada finalizada');
    setCurrentCallId('');
    
    setTimeout(() => {
      setCallStatus('Listo');
    }, 2000);
  }

  function toggleMute() {
    setIsMuted(!isMuted);
    // In production: session.mute() / session.unmute()
  }

  function toggleSpeaker() {
    setIsSpeakerOn(!isSpeakerOn);
    // In production: adjust audio output
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 max-w-sm">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'SIP Conectado' : 'Desconectado'}
          </span>
        </div>
        {callStatus && (
          <p className="text-xs text-gray-500">{callStatus}</p>
        )}
      </div>

      {isCalling && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-lg">{phoneNumber}</p>
          <p className="text-3xl mt-2">{formatDuration(callDuration)}</p>
        </div>
      )}

      {!isCalling && (
        <div className="mb-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Número de teléfono"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
            disabled={!isRegistered}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {!isCalling ? (
          <button
            onClick={handleCall}
            disabled={!isRegistered || !phoneNumber}
            className="col-span-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Phone size={20} />
            <span>Llamar</span>
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 transition ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              <span className="text-xs">Mute</span>
            </button>

            <button
              onClick={handleHangup}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 transition"
            >
              <PhoneOff size={20} />
              <span className="text-xs">Colgar</span>
            </button>

            <button
              onClick={toggleSpeaker}
              className={`py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 transition ${
                !isSpeakerOn ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span className="text-xs">Audio</span>
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 p-3 rounded">
        <p className="mb-1">🔧 <strong>Modo Demo</strong></p>
        <p>Configuración SIP requerida para llamadas reales:</p>
        <ul className="list-disc list-inside mt-1 text-xs space-y-1">
          <li>VITE_SIP_WEBSOCKET_URL</li>
          <li>VITE_SIP_DOMAIN</li>
          <li>Credenciales de usuario SIP</li>
        </ul>
        <p className="mt-2 text-xs">
          Ver <code className="bg-yellow-100 px-1">ARCHITECTURE.md</code> para detalles
        </p>
      </div>
    </div>
  );
}
