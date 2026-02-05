import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../Services/api";
import dayjs from "dayjs";
import EmojiPicker from "emoji-picker-react";
import Linkify from "linkify-react";
import { Smile, Paperclip, Send } from "lucide-react";
import AudioMessage from "../../components/AudioMessage";
import VoiceRecorder from "../../components/VoiceRecorder";

const linkifyOptions = {
  target: "_blank",
  className: "text-blue-600 underline",
};

export default function ChatPanel({ friend, socket }) {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= LOAD CHAT ================= */
  useEffect(() => {
    if (!friend) return;

    (async () => {
      const res = await api.get(`/api/chats/${friend.username}`);
      setMessages(res.data?.messages || []);
    })();
  }, [friend?.username]);

  /* ================= SOCKET RECEIVE ================= */
  useEffect(() => {
    if (!socket) return;

    const handler = (msg) => {
      if (msg.senderId === friend._id) {
        setMessages((p) => [...p, msg]);
      }
    };

    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [socket, friend?._id]);

  /* ================= SEND TEXT ================= */
  const send = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      senderId: user._id,
      senderName: user.username,
      text: newMessage,
      type: "text",
      timestamp: new Date(),
    };

    setMessages((p) => [...p, msg]);
    setNewMessage("");

    socket.emit("sendMessage", {
      ...msg,
      receiverId: friend._id,
    });

    await api.post(`/api/chats/${friend.username}`, { text: msg.text });
  };

  /* ================= FILE UPLOAD ================= */
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const uploadRes = await api.post("/api/upload", form);

    const msg = {
      senderId: user._id,
      senderName: user.username,
      type: file.type.startsWith("image") ? "image" : "file",
      fileUrl: uploadRes.data.url,
      fileName: file.name,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, msg]);

    socket.emit("sendMessage", {
      ...msg,
      receiverId: friend._id,
    });

    await api.post(`/api/chats/${friend.username}`, msg);
  };

  /* ================= VOICE MESSAGE ================= */
  const sendVoiceMessage = async (audioBlob) => {
    try {
      const form = new FormData();
      form.append("file", audioBlob, "voice.webm");

      const uploadRes = await api.post("/api/upload", form);

      const msg = {
        senderId: user._id,
        senderName: user.username,
        type: "audio",
        fileUrl: uploadRes.data.url,
        timestamp: new Date(),
      };

      setMessages((p) => [...p, msg]);

      socket.emit("sendMessage", {
        ...msg,
        receiverId: friend._id,
      });

      await api.post(`/api/chats/${friend.username}`, msg);
    } catch (err) {
      console.error("Voice send failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5]">

      {/* HEADER */}
      <div className="bg-[#075e54] text-white p-4 font-semibold text-lg shadow">
        @{friend.username}
      </div>

      {/* CHAT BODY */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundImage:
            "url('https://i.imgur.com/3e5pG3v.png')",
        }}
      >
        {messages.map((m, i) => {
          const mine = m.senderId === user._id;

          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-lg shadow text-sm
                  ${mine ? "bg-[#dcf8c6]" : "bg-white"}`}
              >
                {m.text && (
                  <Linkify options={linkifyOptions}>
                    {m.text}
                  </Linkify>
                )}

                {m.type === "image" && (
                  <img src={m.fileUrl} className="rounded-lg mt-2 max-h-64" />
                )}

                {m.type === "audio" && (
                  <AudioMessage src={m.fileUrl} />
                )}

                {m.type === "file" && (
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    {m.fileName || "Download file"}
                  </a>
                )}

                <p className="text-[11px] text-gray-600 text-right mt-1">
                  {dayjs(m.timestamp).format("hh:mm A")}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      {/* INPUT BAR */}
      <form
        onSubmit={send}
        className="bg-[#f0f0f0] p-3 flex items-center gap-2"
      >
        {/* EMOJI */}
        <Smile
          className="text-gray-600 cursor-pointer"
          onClick={() => setShowEmoji(!showEmoji)}
        />

        {showEmoji && (
          <div className="absolute bottom-20 left-5">
            <EmojiPicker
              onEmojiClick={(e) =>
                setNewMessage((p) => p + e.emoji)
              }
            />
          </div>
        )}

        {/* TEXT */}
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-white px-4 py-2 rounded-full outline-none"
        />

        {/* FILE */}
        <Paperclip
          className="text-gray-600 cursor-pointer"
          onClick={() => fileInputRef.current.click()}
        />
        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleFile}
        />

        {/* VOICE */}
        <VoiceRecorder onSend={sendVoiceMessage} />

        {/* SEND */}
        <button className="bg-[#075e54] p-2 rounded-full">
          <Send size={18} color="white" />
        </button>
      </form>
    </div>
  );
}
