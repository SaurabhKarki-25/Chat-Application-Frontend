import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

export default function VoiceRecorder({ onSend, disabled }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  /* ⏱ TIMER */
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setSeconds(0);
    }

    return () => clearInterval(timerRef.current);
  }, [recording]);

  /* 🎙 START */
  const startRecording = async () => {
    if (disabled) return;

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({ audio: true });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        if (blob.size > 0) {
          onSend(blob);
        }

        audioChunksRef.current = [];

        // stop mic
        streamRef.current
          ?.getTracks()
          .forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);

    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone permission required");
    }
  };

  /* ⏹ STOP */
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  /* 🔁 TOGGLE */
  const toggleRecording = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  /* ⏱ FORMAT */
  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
  
  <button
    type="button"
    onClick={toggleRecording}
    disabled={disabled}
    className={`
      w-11 h-11 flex items-center justify-center
      rounded-full shadow-md transition
      ${
        recording
          ? "bg-red-500 animate-pulse"
          : "bg-[#25D366] hover:scale-105"
      }
    `}
  >
    {recording ? (
      <Square size={20} color="white" />
    ) : (
      <Mic size={20} color="white" />
    )}
  </button>

  );
}
