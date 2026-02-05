import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../Services/api";
import dayjs from "dayjs";
import EmojiPicker from "emoji-picker-react";
import Linkify from "linkify-react";
import { Smile } from "lucide-react";
import AudioMessage from "../../components/AudioMessage";
import VoiceRecorder from "../../components/VoiceRecorder";

const linkifyOptions = {
  target: "_blank",
  rel: "noopener noreferrer",
  className: "text-blue-600 underline break-all",
};

export default function ChatPanel({ friend, socket }) {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);

  const endRef = useRef(null);

  const isAI = friend?.isAI === true;

  /* ========= SCROLL ========= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ========= LOAD CHAT ========= */
  useEffect(() => {
    if (!friend || isAI) return;

    (async () => {
      const res = await api.get(`/api/chats/${friend.username}`);
      setMessages(res.data?.messages || []);
    })();
  }, [friend?.username]);

  /* ========= SOCKET ========= */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      if (msg.senderId === friend._id) {
        setMessages((p) => [...p, msg]);
      }
    };

    socket.on("receiveMessage", onReceive);
    return () => socket.off("receiveMessage", onReceive);
  }, [socket, friend?._id]);

  /* ========= SEND TEXT ========= */
  const send = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage("");

    const myMsg = {
      senderId: user._id,
      senderName: user.username,
      text,
      type: "text",
      timestamp: new Date(),
    };

    setMessages((p) => [...p, myMsg]);

    socket.emit("sendMessage", {
      senderId: user._id,
      senderName: user.username,
      receiverId: friend._id,
      text,
    });

    await api.post(`/api/chats/${friend.username}`, { text });
  };

  /* ========= SEND VOICE ========= */
  const sendVoiceMessage = async (audioBlob) => {
    try {
      setUploading(true);

      const file = new File(
        [audioBlob],
        `voice-${Date.now()}.webm`,
        { type: "audio/webm" }
      );

      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/api/upload", formData);

      if (!res.data?.url) return;

      const msg = {
        senderId: user._id,
        senderName: user.username,
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

    } finally {
      setUploading(false);
    }
  };

  /* ========= UI ========= */
  return (
    <div className="flex flex-col h-full bg-[#efeae2]">

      {/* HEADER */}
      <div className="bg-[#075e54] text-white p-4 font-semibold shadow">
        @{friend.username}
      </div>

      {/* CHAT AREA */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{
          backgroundImage:
            "url('https://i.imgur.com/2nCt3Sbl.png')",
        }}
      >
        {messages.map((m, i) => {
          const mine = m.senderId === user._id;

          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`
                  max-w-[70%] px-4 py-2 rounded-lg shadow text-sm
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

                {m.type === "audio" && (
                  <AudioMessage src={m.fileUrl} />
                )}

                <p className="text-[10px] text-gray-500 text-right mt-1">
                  {dayjs(m.timestamp).format("hh:mm A")}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={send}
        className="bg-[#f0f0f0] p-2 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          <Smile />
        </button>

        {showEmoji && (
          <div className="absolute bottom-20">
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
          placeholder="Message"
          className="flex-1 px-4 py-2 rounded-full border outline-none"
        />

        <VoiceRecorder
          onSend={sendVoiceMessage}
          disabled={uploading}
        />

        <button
          type="submit"
          className="bg-[#075e54] text-white px-4 py-2 rounded-full"
        >
          Send
        </button>
      </form>
    </div>
  );
}
