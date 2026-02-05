import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";
import { ArrowLeft, Bell, Bot } from "lucide-react";
import { io } from "socket.io-client";
import api from "../../Services/api";
import ChatPanel from "./ChatPanel";

/* 🤖 AI USER */
const AI_USER = {
  _id: "CHATVERSE_AI",
  username: "ChatVerse AI",
  isAI: true,
};

const BACKEND_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ChatPage() {
  const { user } = useContext(AuthContext);

  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unread, setUnread] = useState({});
  const socketRef = useRef(null);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;
    socket.emit("join", user._id);

    socket.on("receiveMessage", (msg) => {
      if (selectedChat?._id !== msg.senderId) {
        setUnread((p) => ({ ...p, [msg.senderId]: true }));
      }
    });

    socket.on("aiReply", () => {
      if (selectedChat?._id !== AI_USER._id) {
        setUnread((p) => ({ ...p, [AI_USER._id]: true }));
      }
    });

    return () => socket.disconnect();
  }, [user?._id, selectedChat]);

  /* ================= FRIENDS ================= */
  const fetchFriends = useCallback(async () => {
    const res = await api.get("/api/friends/list");
    setFriends(res.data || []);
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const selectChat = (chat) => {
    setSelectedChat(chat);
    setUnread((p) => ({ ...p, [chat._id]: false }));
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 text-white">

      {/* ===== SIDEBAR ===== */}
      <motion.div
        animate={{
          width: selectedChat ? "100%" : "100%",
        }}
        className={`
          ${selectedChat ? "hidden md:block md:w-1/3" : "w-full md:w-1/3"}
          p-4 border-r border-white/10 overflow-y-auto
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl">Chats</h2>
          <Bell className="opacity-80" />
        </div>

        {/* AI CARD */}
        <div
          onClick={() => selectChat(AI_USER)}
          className={`
            p-4 mb-4 rounded-xl cursor-pointer flex items-center gap-3
            transition hover:scale-[1.02]
            ${
              selectedChat?._id === AI_USER._id
                ? "bg-purple-500/40"
                : "bg-white/10 hover:bg-white/20"
            }
          `}
        >
          <Bot />
          <div className="flex-1">
            <p className="font-semibold">ChatVerse AI</p>
            <p className="text-sm opacity-70">Ask me anything ✨</p>
          </div>

          {unread[AI_USER._id] && (
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* FRIEND LIST */}
        {friends.map((f) => (
          <div
            key={f._id}
            onClick={() => selectChat(f)}
            className={`
              p-4 mb-2 rounded-xl cursor-pointer flex justify-between items-center
              transition hover:scale-[1.02]
              ${
                selectedChat?._id === f._id
                  ? "bg-white/25"
                  : "bg-white/10 hover:bg-white/20"
              }
            `}
          >
            <span>@{f.username}</span>

            {unread[f._id] && (
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </motion.div>

      {/* ===== CHAT PANEL ===== */}
      <AnimatePresence>
        {selectedChat && (
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            className="w-full md:flex-1"
          >
            {/* MOBILE BACK BUTTON */}
            <div className="md:hidden p-3 flex items-center gap-3 bg-black/20">
              <ArrowLeft
                className="cursor-pointer"
                onClick={() => setSelectedChat(null)}
              />
              <span className="font-semibold">
                {selectedChat.username}
              </span>
            </div>

            <ChatPanel
              friend={selectedChat}
              socket={socketRef.current}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
