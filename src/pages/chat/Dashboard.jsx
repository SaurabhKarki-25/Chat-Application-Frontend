import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Mail, User, LogOut, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../Services/api";
import { io } from "socket.io-client";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [allUsers, setAllUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMail, setShowMail] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Connect socket and handle real-time updates
  useEffect(() => {
    if (!user?._id) return;

    const socket = io("https://chat-application-backend-0x84.onrender.com", {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = socket;
    socket.emit("join", user._id);

    // 🔹 Re-fetch friend data when new request or acceptance happens
    socket.on("friendRequestReceived", fetchDashboardData);
    socket.on("friendRequestAccepted", fetchDashboardData);
    socket.on("friendListUpdated", fetchDashboardData);

    return () => socket.disconnect();
  }, [user?._id]);

  // ✅ Fetch all users & pending requests
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [usersRes, pendingRes] = await Promise.all([
        api.get(
          "https://chat-application-backend-0x84.onrender.com/api/friends/all"
        ),
        api.get(
          "https://chat-application-backend-0x84.onrender.com/api/friends/pending"
        ),
      ]);

      const users = (usersRes.data || []).filter(
        (u) => u._id !== user._id && u._id !== user.id
      );

      setAllUsers(users);
      setFriendRequests(pendingRes.data || []);
    } catch (err) {
      console.error("⚠️ Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load on mount
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // ✅ Send friend request
 const handleAddFriend = async (id, username) => {
  try {
    await api.post(`https://chat-application-backend-0x84.onrender.com/api/friends/request/${id}`);
    alert(`✅ Friend request sent to @${username}`);

    fetchDashboardData(); // refresh UI

    if (socketRef.current) {
      socketRef.current.emit("friendRequestSent", {
        senderId: user._id,
        receiverId: id,
      });
    }
  } catch (err) {
    console.error("❌ Error sending request:", err);
    alert("⚠️ Request already sent or failed.");
  }
};

  const handleAcceptRequest = async (requestId, fromUsername) => {
  try {
    await api.put(`https://chat-application-backend-0x84.onrender.com/api/friends/accept/${requestId}`);
    alert(`🎉 You are now friends with @${fromUsername}`);
    setFriendRequests((prev) => prev.filter((r) => r._id !== requestId));

    window.dispatchEvent(new Event("friendListUpdated"));
    fetchDashboardData();

    if (socketRef.current) {
      socketRef.current.emit("friendAccepted", {
        recipient: user._id,
        requesterUsername: fromUsername,
      });
    }
  } catch (err) {
    console.error("❌ Error accepting request:", err);
  }
};

  // ✅ Logout user
  const handleLogout = () => {
  logout(); // clear auth context or localStorage
  navigate("/login"); // or use full frontend URL if needed
};

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest(".dropdown")) {
        setShowMail(false);
        setShowNotif(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  // 🧩 Loading Screen
  if (loading || !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white">
        <div className="animate-spin h-12 w-12 border-t-4 border-yellow-400 rounded-full mb-4"></div>
        <p className="text-lg font-semibold">Loading ChatVerse...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white flex flex-col">
      {/* 🧭 Navbar */}
      <div className="flex justify-between items-center px-6 sm:px-8 py-4 bg-white/10 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <h1
          className="text-xl sm:text-2xl font-extrabold tracking-wide text-yellow-400 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          ChatVerse 💬
        </h1>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* ✉️ Mailbox (Pending Friend Requests) */}
          <div className="relative dropdown">
            <Mail
              size={24}
              className="cursor-pointer hover:text-yellow-400 transition"
              onClick={() => {
                setShowMail(!showMail);
                setShowNotif(false);
                setShowProfileMenu(false);
              }}
            />
            {friendRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs font-bold px-1 rounded-full">
                {friendRequests.length}
              </span>
            )}
            <AnimatePresence>
              {showMail && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-72 bg-white text-black rounded-xl shadow-lg p-3 z-50"
                >
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Friend Requests
                  </h3>
                  {friendRequests.length > 0 ? (
                    friendRequests.map((req) => (
                      <div
                        key={req._id}
                        className="p-2 bg-gray-100 rounded-md mb-2 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold">@{req.requester.username}</p>
                          <p className="text-xs text-gray-500">
                            {req.requester.email}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleAcceptRequest(req._id, req.requester.username)
                          }
                          className="bg-indigo-600 text-white text-xs px-2 py-1 rounded hover:bg-indigo-700 transition"
                        >
                          Accept
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center">
                      No new requests
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 🔔 Notifications */}
          <div className="relative dropdown">
            <Bell
              size={24}
              className="cursor-pointer hover:text-yellow-400 transition"
              onClick={() => {
                setShowNotif(!showNotif);
                setShowMail(false);
                setShowProfileMenu(false);
              }}
            />
            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-64 bg-white text-black rounded-xl shadow-lg p-3 z-50"
                >
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Notifications
                  </h3>
                  <p className="text-gray-500 text-sm">
                    You’ll receive alerts here when a request is accepted.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 💬 Chat Page Shortcut */}
          <MessageCircle
            size={24}
            className="cursor-pointer hover:text-yellow-400 transition"
            onClick={() =>
              navigate(
                "https://chat-application-backend-0x84.onrender.com/dashboard/chat"
              )
            }
          />

          {/* 👤 Profile Menu */}
          <div className="relative dropdown">
            <User
              size={26}
              className="cursor-pointer hover:text-yellow-400 transition"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowMail(false);
                setShowNotif(false);
              }}
            />
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 bg-white text-black rounded-xl shadow-lg p-3 w-48 z-50"
                >
                  <div className="border-b pb-2 mb-2">
                    <p className="font-semibold">@{user?.username}</p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 w-full text-sm font-semibold"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 🧩 All Users (Dashboard Grid) */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">
            Welcome, {user?.username || "User"} 👋
          </h2>
          <p className="text-lg text-gray-200 mt-2">
            Your ChatVerse ID:{" "}
            <span className="text-yellow-400">@{user?.username}</span>
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.length > 0 ? (
            allUsers.map((usr) => (
              <motion.div
                key={usr._id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-white/20 rounded-xl p-4 flex items-center justify-between hover:bg-white/30 transition"
              >
                <div>
                  <h4 className="font-bold text-lg">@{usr.username}</h4>
                  <p className="text-gray-200 text-sm">{usr.email}</p>
                </div>

                {/* User status logic */}
                {usr.status === "friend" ? (
                  <span className="text-green-400 font-semibold">
                    Friend ✅
                  </span>
                ) : usr.status === "sent" ? (
                  <span className="text-yellow-400 font-semibold">
                    Pending ⏳
                  </span>
                ) : usr.status === "received" ? (
                  <span className="text-blue-400 font-semibold">
                    Requested 📩
                  </span>
                ) : (
                  <button
                    onClick={() => handleAddFriend(usr._id, usr.username)}
                    className="bg-yellow-400 text-black font-semibold px-3 py-1 rounded-md hover:bg-yellow-300 transition"
                  >
                    Add Friend
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <p className="text-center text-gray-300 text-lg mt-8">
              No users available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
