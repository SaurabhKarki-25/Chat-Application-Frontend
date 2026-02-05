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
  const [uploading, setUploading] = useState(false);

  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ========= AUTO SCROLL ========= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ========= LOAD CHAT ========= */
  useEffect(() => {
    if (!friend) return;

    (async () => {
      const res = await api.get(`/api/chats/${friend.username}`);
      setMessages(res.data?.messages || []);
    })();
  }, [friend?.username]);

  /* ========= SOCKET ========= */
  useEffect(() => {
    if (!socket) return;

    socket.on("receiveMessage", (msg) => {
      if (msg.senderId === friend._id) {
        setMessages((p) => [...p, msg]);
      }
    });

    return () => socket.off("receiveMessage");
  }, [socket, friend?._id]);

  /* ========= SEND TEXT ========= */
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

  /* ========= FILE SEND ========= */
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    const res = await api.post("/api/upload", form);

    const type = file.type.startsWith("image")
      ? "image"
      : file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("audio")
      ? "audio"
      : "file";

    const msg = {
      senderId: user._id,
      senderName: user.username,
      type,
      fileUrl: res.data.url,
      fileName: file.name,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, msg]);

    socket.emit("sendMessage", {
      ...msg,
      receiverId: friend._id,
    });

    await api.post(`/api/chats/${friend.username}`, msg);

    setUploading(false);
  };

  /* ========= VOICE ========= */
  const sendVoice = async (blob) => {
    const file = new File([blob], "voice.webm", { type: "audio/webm" });

    const form = new FormData();
    form.append("file", file);

    const res = await api.post("/api/upload", form);

    const msg = {
      senderId: user._id,
      type: "audio",
      fileUrl: res.data.url,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, msg]);

    socket.emit("sendMessage", {
      ...msg,
      receiverId: friend._id,
    });

    await api.post(`/api/chats/${friend.username}`, msg);
  };

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5]">

      {/* HEADER */}
      <div className="bg-[#075e54] text-white p-4 font-semibold shadow">
        @{friend.username}
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#efeae2]">

        {messages.map((m, i) => {
          const mine = m.senderId === user._id;

          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm shadow
                  ${mine ? "bg-[#dcf8c6]" : "bg-white"}`}
              >
                {m.text && (
                  <Linkify options={linkifyOptions}>{m.text}</Linkify>
                )}

                {m.type === "image" && (
                  <img src={m.fileUrl} className="rounded-lg max-h-60 mt-2" />
                )}

                {m.type === "video" && (
                  <video controls src={m.fileUrl} className="rounded-lg mt-2" />
                )}

                {m.type === "audio" && <AudioMessage src={m.fileUrl} />}

                {m.type === "file" && (
                  <a href={m.fileUrl} target="_blank" className="underline">
                    📄 {m.fileName}
                  </a>
                )}

                <p className="text-[10px] text-gray-500 text-right">
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
        className="bg-white p-2 flex items-center gap-2 sticky bottom-0"
      >
        <button type="button" onClick={() => setShowEmoji(!showEmoji)}>
          <Smile />
        </button>

        {showEmoji && (
          <div className="absolute bottom-20">
            <EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} />
          </div>
        )}

        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message"
          className="flex-1 border rounded-full px-4 py-2"
        />

        {/* FILE BUTTON */}
        <button type="button" onClick={() => fileInputRef.current.click()}>
          <Paperclip />
        </button>

        <input
          ref={fileInputRef}
          hidden
          type="file"
          onChange={handleFile}
        />

        {/* VOICE */}
        <VoiceRecorder onSend={sendVoice} />

        <button className="bg-[#075e54] text-white p-2 rounded-full">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
