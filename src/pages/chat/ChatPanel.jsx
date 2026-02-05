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

  /* ========= SCROLL ========= */
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

  /* ========= FILE ========= */
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await api.post("/api/upload", form);

    const msg = {
      senderId: user._id,
      type: "image",
      fileUrl: res.data.url,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, msg]);

    socket.emit("sendMessage", {
      ...msg,
      receiverId: friend._id,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] font-sans">

      {/* HEADER */}
      <div className="bg-[#075e54] text-white p-4 font-semibold text-lg shadow">
        @{friend.username}
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {messages.map((m, i) => {
          const mine = m.senderId === user._id;

          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`
                  max-w-[75%] px-4 py-2 rounded-lg shadow text-[15px]
                  ${mine
                    ? "bg-[#dcf8c6] text-black"
                    : "bg-white text-black"}
                `}
              >
                {m.text && (
                  <Linkify options={linkifyOptions}>
                    {m.text}
                  </Linkify>
                )}

                {m.type === "image" && (
                  <img
                    src={m.fileUrl}
                    className="rounded-lg mt-2 max-h-64 object-cover"
                  />
                )}

                {m.type === "audio" && (
                  <AudioMessage src={m.fileUrl} />
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
        className="bg-white p-3 flex items-center gap-2 border-t"
      >
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

        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-gray-100 px-4 py-2 rounded-full outline-none text-black"
        />

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

        <VoiceRecorder onSend={() => {}} />

        <button className="bg-[#075e54] p-2 rounded-full">
          <Send size={18} color="white" />
        </button>
      </form>
    </div>
  );
}
