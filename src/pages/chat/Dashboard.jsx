import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../Services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, LogOut, MessageCircle, Users, Inbox } from "lucide-react";

/* ✅ USE SAME ENV VAR EVERYWHERE */
const BACKEND_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [allUsers, setAllUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const [showMail, setShowMail] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  /* ================= FETCH DATA ================= */
  const fetchDashboardData = useCallback(
    async (isSilent = false) => {
      if (!user?._id) return;

      try {
        isSilent ? setSilentRefreshing(true) : setLoading(true);

        const [usersRes, pendingRes] = await Promise.all([
          api.get("/api/friends/all"),
          api.get("/api/friends/pending/received"),
        ]);

        setAllUsers(usersRes.data || []);
        setFriendRequests(pendingRes.data || []);
      } catch (err) {
        console.error("Dashboard error:", err?.response?.data || err.message);
      } finally {
        isSilent ? setSilentRefreshing(false) : setLoading(false);
      }
    },
    [user?._id]
  );

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.emit("join", user._id);
    socketRef.current = socket;

    socket.on("friendRequestReceived", () => fetchDashboardData(true));
    socket.on("friendRequestAccepted", () => fetchDashboardData(true));
    socket.on("friendListUpdated", () => fetchDashboardData(true));

    return () => socket.disconnect();
  }, [user?._id, fetchDashboardData]);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ================= AUTO REFRESH ================= */
  useEffect(() => {
    if (!user?._id) return;
    const interval = setInterval(() => fetchDashboardData(true), 40000);
    return () => clearInterval(interval);
  }, [user?._id, fetchDashboardData]);

  /* ================= ACTIONS ================= */
  const handleAddFriend = async (id) => {
    try {
      setSendingId(id);
      await api.post(`/api/friends/request/${id}`);
      fetchDashboardData(true);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to send request");
    } finally {
      setSendingId(null);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.put(`/api/friends/accept/${requestId}`);
      fetchDashboardData(true);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to accept request");
    }
  };

  const handleLogout = () => {
    socketRef.current?.disconnect();
    logout();
    navigate("/login", { replace: true });
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-6 py-4 bg-white/10 backdrop-blur-md">
        <h1
          className="text-2xl font-extrabold text-yellow-400 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          ChatVerse 💬
        </h1>

        <div className="flex items-center gap-5">
          <button onClick={() => navigate("/dashboard/requests")}>
            <Inbox />
          </button>

          <button onClick={() => navigate("/dashboard/friends")}>
            <Users />
          </button>

          {/* MAIL */}
          <div className="relative">
            <Mail onClick={() => setShowMail(!showMail)} />

            {friendRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1 rounded-full">
                {friendRequests.length}
              </span>
            )}

            {showMail && (
              <div className="absolute right-0 mt-3 w-64 bg-white text-black p-3 rounded-xl">
                {friendRequests.map((req) => (
                  <div key={req._id} className="flex justify-between mb-2">
                    <span>@{req.requester?.username}</span>
                    <button
                      onClick={() => handleAccept(req._id)}
                      className="bg-indigo-600 text-white px-2 rounded"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <MessageCircle onClick={() => navigate("/dashboard/chat")} />

          {/* PROFILE */}
          <div className="relative">
            <User onClick={() => setShowProfileMenu(!showProfileMenu)} />
            {showProfileMenu && (
              <div className="absolute right-0 bg-white text-black p-3 rounded-xl">
                <p>@{user.username}</p>
                <button
                  onClick={handleLogout}
                  className="flex gap-2 text-red-600"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* USERS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {allUsers.map((usr) => (
          <div
            key={usr._id}
            className="bg-white/15 backdrop-blur-xl rounded-2xl p-5 flex justify-between items-center"
          >
            <div>
              <h4>@{usr.username}</h4>
              <p>{usr.email}</p>
            </div>

            <button
              onClick={() => handleAddFriend(usr._id)}
              disabled={sendingId === usr._id}
              className="bg-yellow-400 text-black px-3 py-1 rounded-full"
            >
              {sendingId === usr._id ? "Sending..." : "Add Friend"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
