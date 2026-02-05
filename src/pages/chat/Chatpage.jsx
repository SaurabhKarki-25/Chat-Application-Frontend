import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";
import { ArrowLeft, Bell, Bot } from "lucide-react";
import { io } from "socket.io-client";
import api from "../../Services/api";
import ChatPanel from "./ChatPanel";

/* 🤖 AI USER (frontend only) */
const AI_USER = {
  _id: "CHATVERSE_AI",
  username: "ChatVerse AI",
  isAI: true,
};

export default function ChatPage() {
  const { user } = useContext(AuthContext);

  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [unread, setUnread] = useState({});
  const socketRef = useRef(null);

  /* ================= SOCKET (ONE TIME) ================= */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io("http://localhost:5000", {
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

  /* ================= FRIEND LIST ================= */
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
    <div className="h-screen flex bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-700 text-white">

      {/* SIDEBAR */}
      <motion.div
        animate={{ width: selectedChat ? "30%" : "100%" }}
        className="p-4 border-r border-white/10 overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          {selectedChat ? (
            <ArrowLeft onClick={() => setSelectedChat(null)} />
          ) : (
            <span />
          )}
          <h2 className="font-bold text-xl">Your Chats</h2>
          <Bell />
        </div>

        {/* 🤖 AI CARD */}
        <div
          onClick={() => selectChat(AI_USER)}
          className={`p-4 mb-4 rounded-xl cursor-pointer flex items-center gap-3
            ${
              selectedChat?._id === AI_USER._id
                ? "bg-purple-500/30"
                : "bg-purple-500/20 hover:bg-purple-500/30"
            }`}
        >
          <Bot />
          <div className="flex-1">
            <p className="font-bold">ChatVerse AI</p>
            <p className="text-sm opacity-80">Ask me anything ✨</p>
          </div>
          {unread[AI_USER._id] && (
            <span className="w-3 h-3 bg-red-500 rounded-full" />
          )}
        </div>

        {/* FRIENDS */}
        {friends.map((f) => (
          <div
            key={f._id}
            onClick={() => selectChat(f)}
            className="p-4 mb-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer flex justify-between"
          >
            @{f.username}
            {unread[f._id] && (
              <span className="w-3 h-3 bg-red-500 rounded-full" />
            )}
          </div>
        ))}
      </motion.div>

      {/* CHAT PANEL */}
      <AnimatePresence>
        {selectedChat && (
          <motion.div className="flex-1">
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
