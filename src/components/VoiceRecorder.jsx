import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";

export default function VoiceRecorder({ onSend, disabled }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

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

  /* 🎙 START RECORD */
  const startRecording = async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        onSend(audioBlob);

        // cleanup
        stream.getTracks().forEach((t) => t.stop());
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  /* ⏹ STOP RECORD */
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  /* ⏱ FORMAT TIME */
  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <button
      type="button"
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-full
        ${recording ? "bg-red-500 text-white" : "bg-white/20 text-white"}
      `}
    >
      {recording ? <Square size={18} /> : <Mic size={18} />}
      {recording && <span className="text-sm">{formatTime(seconds)}</span>}
    </button>
  );
}
