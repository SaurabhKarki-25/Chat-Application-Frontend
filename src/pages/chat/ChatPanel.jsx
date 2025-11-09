import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../Services/api";
import { io } from "socket.io-client";
import dayjs from "dayjs";

export default function ChatPanel({ friend }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ✅ Initialize socket connection once per mount
  useEffect(() => {
    if (!user?._id || !friend?._id) return;

    const socket = io("https://chat-application-backend-0x84.onrender.com", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Join this user's private room
    socket.emit("join", user._id);

    // ✅ Listen for incoming messages (only if from selected friend)
    socket.on("receiveMessage", (data) => {
      if (
        String(data.senderId) === String(friend._id) &&
        String(data.receiverId) === String(user._id)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            senderId: friend._id,
            text: data.message,
            timestamp: data.timestamp || new Date(),
          },
        ]);
      }
    });

    return () => socket.disconnect();
  }, [user?._id, friend?._id]);

  // ✅ Load existing chat history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await api.get(`https://chat-application-backend-0x84.onrender.com/chats/${friend.username}`);
        const chatMsgs =
          res.data?.messages?.map((m) => ({
            senderId:
              m.senderId?._id?.toString() || m.senderId?.toString(),
            text: m.text,
            timestamp: m.timestamp || m.createdAt || new Date(),
          })) || [];
        setMessages(chatMsgs);
      } catch (err) {
        console.error("⚠️ Error fetching chat:", err);
      }
    };
    loadMessages();
  }, [friend.username]);

  // ✅ Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Send new message (socket + backend)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgObj = {
      senderId: user._id,
      receiverId: friend._id,
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    // Show immediately in UI
    setMessages((prev) => [
      ...prev,
      { senderId: user._id, text: msgObj.message, timestamp: msgObj.timestamp },
    ]);
    setNewMessage("");

    try {
      // Emit to socket (realtime)
      socketRef.current.emit("sendMessage", msgObj);

      // Persist in DB
      await api.post(`https://chat-application-backend-0x84.onrender.com/chats/${friend.username}`, { text: msgObj.message });
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  // ✅ Format readable time
  const formatTime = (timestamp) => {
    const date = dayjs(timestamp);
    const now = dayjs();
    if (date.isSame(now, "day")) return date.format("h:mm A");
    if (date.isSame(now.subtract(1, "day"), "day")) return "Yesterday";
    return date.format("DD MMM, h:mm A");
  };

  return (
    <div className="flex flex-col h-full">
      {/* 🔹 Header */}
      <div className="p-4 bg-white/10 flex justify-between items-center shadow">
        <div>
          <h2 className="font-bold text-xl">@{friend.username}</h2>
          <p className="text-gray-300 text-sm">{friend.email}</p>
        </div>
      </div>

      {/* 🔹 Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
        {messages.length === 0 && (
          <p className="text-center text-gray-300 mt-4">
            No messages yet. Start chatting 👋
          </p>
        )}

        {messages.map((msg, i) => {
          const isMine = String(msg.senderId) === String(user._id);
          return (
            <div
              key={i}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl p-3 mb-1 ${
                  isMine
                    ? "bg-yellow-400 text-black rounded-br-none"
                    : "bg-white/20 text-white rounded-bl-none"
                }`}
              >
                <p
                  className={`text-xs font-semibold mb-1 ${
                    isMine ? "text-gray-800" : "text-yellow-300"
                  }`}
                >
                  {isMine ? "You" : `@${friend.username}`}
                </p>
                <p className="text-sm break-words">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMine ? "text-gray-800" : "text-gray-300"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 🔹 Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-4 flex gap-2 bg-white/10 backdrop-blur-md"
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-2 bg-white/20 text-white rounded-full placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-yellow-400 text-black rounded-full font-semibold hover:bg-yellow-300 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
