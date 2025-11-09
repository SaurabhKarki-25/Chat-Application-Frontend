import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../context/AuthContext";
import { ArrowLeft, MessageCircle, Bell, Circle } from "lucide-react";
import { io } from "socket.io-client";
import api from "../../Services/api";
import ChatPanel from "./ChatPanel";

export default function ChatPage() {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  // ✅ Initialize Socket.io Connection
  useEffect(() => {
    if (!user?._id) return;

    const socket = io("https://chat-application-backend-0x84.onrender.com", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.emit("join", user._id);

    // Friend list real-time sync
    socket.on("friendListUpdated", () => fetchAcceptedFriends());
    socket.on("friendRequestAccepted", () => fetchAcceptedFriends());

    // Online user tracking
    socket.on("userOnline", ({ userId }) =>
      setOnlineUsers((prev) => [...new Set([...prev, userId])])
    );

    socket.on("userOffline", ({ userId }) =>
      setOnlineUsers((prev) => prev.filter((id) => id !== userId))
    );

    // Handle incoming messages
    socket.on("receiveMessage", ({ senderId }) => {
      if (selectedFriend?._id !== senderId) {
        setUnreadMessages((prev) => ({ ...prev, [senderId]: true }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, selectedFriend]);

  // ✅ Fetch accepted friends securely
  const fetchAcceptedFriends = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await api.get("https://chat-application-backend-0x84.onrender.com/friends/list");
      const accepted = (res.data || []).filter((f) => f._id !== user._id);
      setFriends(accepted);
    } catch (err) {
      console.error("⚠️ Error fetching friends:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ Fetch once + listen for manual updates
  useEffect(() => {
    fetchAcceptedFriends();
    const handler = () => fetchAcceptedFriends();
    window.addEventListener("friendListUpdated", handler);
    return () => window.removeEventListener("friendListUpdated", handler);
  }, [fetchAcceptedFriends]);

  // ✅ Handle friend selection
  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    setUnreadMessages((prev) => ({
      ...prev,
      [friend._id]: false,
    }));
  };

  // ✅ Check online status
  const isOnline = (id) => onlineUsers.includes(id);

  return (
    <div className="h-screen flex bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-700 text-white overflow-hidden">
      {/* Sidebar (Friend List) */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ width: selectedFriend ? "30%" : "100%" }}
        transition={{ duration: 0.4 }}
        className="flex flex-col border-r border-white/10 p-4 overflow-y-auto relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {selectedFriend && (
              <ArrowLeft
                className="cursor-pointer hover:text-yellow-400"
                onClick={() => setSelectedFriend(null)}
              />
            )}
            <h2 className="text-2xl font-bold">Your Chats</h2>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <Bell
              size={22}
              className={`cursor-pointer hover:text-yellow-400 transition ${
                Object.values(unreadMessages).some(Boolean)
                  ? "animate-bounce text-yellow-400"
                  : ""
              }`}
            />
            {Object.values(unreadMessages).some(Boolean) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            )}
          </div>
        </div>

        {/* Friends List */}
        {loading ? (
          <div className="text-gray-300 text-center mt-20 animate-pulse">
            Loading your friends...
          </div>
        ) : friends.length > 0 ? (
          friends.map((f) => (
            <motion.div
              key={f._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 mb-3 rounded-lg flex justify-between items-center cursor-pointer transition-all ${
                selectedFriend?._id === f._id
                  ? "bg-white/30 shadow-lg"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              onClick={() => handleSelectFriend(f)}
            >
              <div className="flex items-center gap-3">
                {/* 🟢 Online Status */}
                <Circle
                  size={10}
                  className={`${
                    isOnline(f._id)
                      ? "text-green-400 fill-green-400"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <p className="font-semibold text-lg">@{f.username}</p>
                  <p className="text-gray-300 text-sm truncate w-44 sm:w-60">
                    {f.email}
                  </p>
                </div>
              </div>

              {/* Message Icon */}
              <div className="relative">
                <MessageCircle
                  className="text-yellow-400 hover:scale-110 transition-transform"
                  size={20}
                />
                {unreadMessages[f._id] && (
                  <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full"></span>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-gray-300 mt-10 text-center">
            No accepted friends yet — accept a request from your mailbox ✨
          </p>
        )}
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            key="chat-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4 }}
            className="flex-1 bg-gradient-to-br from-purple-800 via-indigo-700 to-blue-700 flex flex-col"
          >
            <ChatPanel friend={selectedFriend} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
