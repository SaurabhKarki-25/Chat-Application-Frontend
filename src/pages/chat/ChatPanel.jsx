import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../Services/api";
import dayjs from "dayjs";
import EmojiPicker from "emoji-picker-react";
import Linkify from "linkify-react";
import { Smile, Paperclip } from "lucide-react";
import AudioMessage from "../../components/AudioMessage";
import VoiceRecorder from "../../components/VoiceRecorder";

const linkifyOptions = {
  target: "_blank",
  rel: "noopener noreferrer",
  className: "text-blue-400 underline break-all",
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

  /* ========= AUTO SCROLL ========= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  /* ========= RESET ========= */
  useEffect(() => {
    setMessages([]);
    setNewMessage("");
    setAiTyping(false);
  }, [friend?._id]);

  /* ========= LOAD HISTORY ========= */
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

    (async () => {
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
    })();
  }, [friend?.username, isAI]);

  /* ========= SOCKET ========= */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      if (!isAI && msg.senderId === friend._id) {
        setMessages((p) => [...p, msg]);
      }
    };

    const onAI = (msg) => {
      if (!isAI) return;
      setAiTyping(false);
      setMessages((p) => [...p, msg]);
    };

    socket.on("receiveMessage", onReceive);
    socket.on("aiReply", onAI);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("aiReply", onAI);
    };
  }, [socket, friend?._id]);

  /* ========= SEND ========= */
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

    if (isAI) {
      setAiTyping(true);
      const res = await api.post("/api/ai/chat", { message: text });
      setMessages((p) => [...p, res.data]);
      setAiTyping(false);
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

  /* ========= UI ========= */
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="sticky top-0 z-10 p-4 bg-white/10 backdrop-blur-xl font-semibold shadow">
        {isAI ? "🤖 ChatVerse AI" : `@${friend.username}`}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">

        {messages.map((m, i) => {
          const mine = m.senderId === user._id;

          return (
            <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`
                  max-w-[75%] px-4 py-2 rounded-2xl shadow
                  ${
                    mine
                      ? "bg-yellow-400 text-black rounded-br-md"
                      : "bg-white/20 text-white rounded-bl-md"
                  }
                `}
              >
                {m.text && (
                  <p className="text-sm">
                    <Linkify options={linkifyOptions}>{m.text}</Linkify>
                  </p>
                )}

                {m.type === "image" && (
                  <img
                    src={m.fileUrl}
                    className="rounded-lg mt-2 max-h-60 object-cover"
                  />
                )}

                {m.type === "audio" && <AudioMessage src={m.fileUrl} />}

                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {dayjs(m.timestamp).format("hh:mm A")}
                </p>
              </div>
            </div>
          );
        })}

        {isAI && aiTyping && (
          <div className="bg-purple-500/30 px-4 py-2 rounded-xl w-fit animate-pulse">
            🤖 AI is typing...
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={send}
        className="sticky bottom-0 p-3 bg-white/10 backdrop-blur-xl flex items-center gap-2"
      >
        <button type="button" onClick={() => setShowEmoji(!showEmoji)}>
          <Smile />
        </button>

        {showEmoji && (
          <div className="absolute bottom-16 left-3 z-50">
            <EmojiPicker onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} />
          </div>
        )}

        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full bg-white/20 outline-none"
        />

        <VoiceRecorder onSend={() => {}} />

        <button className="bg-yellow-400 text-black px-4 py-2 rounded-full">
          Send
        </button>
      </form>
    </div>
  );
}
