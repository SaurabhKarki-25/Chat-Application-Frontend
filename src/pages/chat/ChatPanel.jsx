import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../Services/api";
import dayjs from "dayjs";
import EmojiPicker from "emoji-picker-react";
import Linkify from "linkify-react";
import { Smile, Paperclip } from "lucide-react";
import AudioMessage from "../../components/AudioMessage";
import VoiceRecorder from "../../components/VoiceRecorder";


/* 🔗 Linkify config */
const linkifyOptions = {
  target: "_blank",
  rel: "noopener noreferrer",
  className: "text-blue-400 underline break-all",
};

/* ⬇ Download helper */
const downloadFile = async (url, filename = "download") => {
  const res = await fetch(url);
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export default function ChatPanel({ friend, socket }) {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);

  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  const isAI = friend?.isAI === true;
  /* ================= VOICE MESSAGE ================= */
  const sendVoiceMessage = async (audioBlob) => {
  try {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", audioBlob, "voice-message.webm");

    const res = await api.post("/api/upload", formData);

    const voiceMsg = {
      senderId: user._id,
      senderName: user.username,
      type: "audio",
      fileUrl: res.data.url,
      fileName: "Voice Message",
      timestamp: new Date(),
    };

    setMessages((p) => [...p, voiceMsg]);

    if (!isAI) {
      socket.emit("sendMessage", {
        ...voiceMsg,
        receiverId: friend._id,
      });

      await api.post(`/api/chats/${friend.username}`, voiceMsg);
    }
  } catch (err) {
    console.error("Voice upload failed:", err);
  } finally {
    setUploading(false);
  }
};

  /* ================= RESET ================= */
  useEffect(() => {
    setMessages([]);
    setNewMessage("");
    setAiTyping(false);
    setShowEmoji(false);
  }, [friend?._id]);

  /* ================= LOAD HISTORY ================= */
  useEffect(() => {
    if (!friend) return;

    if (isAI) {
      setMessages([
        {
          senderId: "CHATVERSE_AI",
          senderName: "ChatVerse AI",
          text: "Hi 👋 I’m ChatVerse AI. Ask me anything!",
          type: "text",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const loadChat = async () => {
      const res = await api.get(`/api/chats/${friend.username}`);

      const formatted =
        res.data?.messages?.map((m) => ({
          senderId:
            typeof m.senderId === "object" ? m.senderId._id : m.senderId,
          senderName:
            typeof m.senderId === "object"
              ? m.senderId.username
              : friend.username,
          text: m.text || "",
          type: m.type || "text",
          fileUrl: m.fileUrl || "",
          fileName: m.fileName || "",
          timestamp: m.timestamp || new Date(),
        })) || [];

      setMessages(formatted);
    };

    loadChat();
  }, [friend?.username, isAI]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (msg) => {
      if (!isAI && msg.senderId === friend._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const onAIReply = (msg) => {
      if (!isAI) return;
      setAiTyping(false);
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveMessage", onReceiveMessage);
    socket.on("aiReply", onAIReply);

    return () => {
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("aiReply", onAIReply);
    };
  }, [socket, isAI, friend?._id]);

  /* ================= SCROLL ================= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  /* ================= EMOJI ================= */
  const handleEmojiClick = (emoji) => {
    setNewMessage((p) => p + emoji.emoji);
  };

  /* ================= FILE UPLOAD ================= */
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/api/upload", formData);

      const type = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : file.type.startsWith("audio")
        ? "audio"
        : "file";

      const mediaMsg = {
        senderId: user._id,
        senderName: user.username,
        type,
        fileUrl: uploadRes.data.url,
        fileName: file.name,
        timestamp: new Date(),
      };

      setMessages((p) => [...p, mediaMsg]);

      if (!isAI) {
        socket.emit("sendMessage", {
          ...mediaMsg,
          receiverId: friend._id,
        });

        await api.post(`/api/chats/${friend.username}`, mediaMsg);
      }
    } finally {
      setUploading(false);
      fileInputRef.current.value = "";
    }
  };

  /* ================= SEND TEXT (AI UNTOUCHED) ================= */
  const send = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage("");
    setShowEmoji(false);

    const myMsg = {
      senderId: user._id,
      senderName: user.username,
      text,
      type: "text",
      timestamp: new Date(),
    };

    setMessages((p) => [...p, myMsg]);

    /* 🤖 AI (UNCHANGED) */
    if (isAI) {
      setAiTyping(true);
      try {
        const res = await api.post("/api/ai/chat", {
          message: text,
          history: messages.slice(-10).map((m) => ({
            role: m.senderId === user._id ? "user" : "assistant",
            content: m.text,
          })),
        });
        setMessages((p) => [...p, res.data]);
      } catch {
        setMessages((p) => [
          ...p,
          {
            senderId: "CHATVERSE_AI",
            senderName: "ChatVerse AI",
            text: "⚠️ AI failed to respond",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setAiTyping(false);
      }
      return;
    }

    socket.emit("sendMessage", {
      senderId: user._id,
      senderName: user.username,
      receiverId: friend._id,
      text,
    });

    await api.post(`/api/chats/${friend.username}`, { text });
  };

  /* ================= UI ================= */
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white/10 font-bold">
        {isAI ? "🤖 ChatVerse AI" : `@${friend.username}`}
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((m, i) => {
          const mine = m.senderId === user._id;

          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[65%] p-3 rounded-xl ${
                  mine
                    ? "bg-yellow-400 text-black"
                    : m.senderId === "CHATVERSE_AI"
                    ? "bg-purple-500 text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                <p className="text-xs opacity-70 mb-1">
                  {mine ? "You" : m.senderName}
                </p>

                {m.type === "image" && (
                  <img src={m.fileUrl} className="rounded-lg max-w-xs cursor-pointer" />
                )}

                {m.type === "video" && (
                  <video controls className="rounded-lg max-w-xs" src={m.fileUrl} />
                )}

                {m.type === "audio" && <AudioMessage src={m.fileUrl} />}

                {m.type === "file" && (
                  <button
                    onClick={() => downloadFile(m.fileUrl, m.fileName)}
                    className="text-blue-400 underline"
                  >
                    📄 {m.fileName}
                  </button>
                )}

                {m.text && (
                  <p className="break-words">
                    <Linkify options={linkifyOptions}>{m.text}</Linkify>
                  </p>
                )}

                <p className="text-[10px] opacity-60 mt-1">
                  {dayjs(m.timestamp).format("hh:mm A")}
                </p>
              </div>
            </div>
          );
        })}

        {isAI && aiTyping && (
          <div className="bg-purple-500/30 px-4 py-2 rounded-xl animate-pulse w-fit">
            🤖 ChatVerse AI is typing...
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <form
  onSubmit={send}
  className="p-4 flex gap-2 bg-white/10 relative items-center"
>
  {/* 📎 FILE ATTACH */}
  <button
    type="button"
    onClick={() => fileInputRef.current.click()}
    className="text-yellow-400"
  >
    <Paperclip size={22} />
  </button>

  <input
    ref={fileInputRef}
    type="file"
    hidden
    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip"
    onChange={handleFileSelect}
  />

  {/* 😀 EMOJI */}
  <button
    type="button"
    onClick={() => setShowEmoji((p) => !p)}
    className="text-yellow-400"
  >
    <Smile size={22} />
  </button>

  {showEmoji && (
    <div className="absolute bottom-16 left-4 z-50">
      <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} />
    </div>
  )}

  {/* ✍ TEXT INPUT */}
  <input
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    disabled={uploading}
    placeholder={uploading ? "Uploading..." : "Type a message..."}
    className="flex-1 px-4 py-2 rounded-full bg-white/20 outline-none"
  />

  {/* 🎙 VOICE RECORDER (WHATSAPP STYLE) */}
  <VoiceRecorder
    onSend={sendVoiceMessage}
    disabled={uploading}
  />

  {/* 📤 SEND */}
  <button
    type="submit"
    className="bg-yellow-400 px-5 py-2 rounded-full font-semibold text-black"
  >
    Send
  </button>
</form>

    </div>
  );
}
