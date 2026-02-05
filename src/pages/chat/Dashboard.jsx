import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../../Services/api";
import { Mail, User, LogOut, MessageCircle, Users, Inbox } from "lucide-react";

const BACKEND_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [allUsers, setAllUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMail, setShowMail] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  /* ================= FETCH ================= */
  const fetchDashboardData = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoading(true);

      const [usersRes, pendingRes] = await Promise.all([
        api.get("/api/friends/all"),
        api.get("/api/friends/pending/received"),
      ]);

      setAllUsers(usersRes.data || []);
      setFriendRequests(pendingRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(BACKEND_URL);
    socket.emit("join", user._id);
    socketRef.current = socket;

    socket.on("friendRequestReceived", fetchDashboardData);
    socket.on("friendRequestAccepted", fetchDashboardData);
    socket.on("friendListUpdated", fetchDashboardData);

    return () => socket.disconnect();
  }, [user?._id, fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ================= ACTIONS ================= */
  const handleAddFriend = async (id) => {
    try {
      setSendingId(id);
      await api.post(`/api/friends/request/${id}`);
      fetchDashboardData();
    } finally {
      setSendingId(null);
    }
  };

  const handleAccept = async (requestId) => {
    await api.put(`/api/friends/accept/${requestId}`);
    fetchDashboardData();
  };

  const handleLogout = () => {
    socketRef.current?.disconnect();
    logout();
    navigate("/login");
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-pink-600 text-white text-xl">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">

      {/* ===== NAVBAR ===== */}
      <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-white/10 backdrop-blur-lg sticky top-0 z-50">

        <h1
          onClick={() => navigate("/dashboard")}
          className="text-xl md:text-2xl font-bold text-yellow-400 cursor-pointer"
        >
          ChatVerse 💬
        </h1>

        <div className="flex items-center gap-4">

          <Inbox
            className="cursor-pointer hover:scale-110"
            onClick={() => navigate("/dashboard/requests")}
          />

          <Users
            className="cursor-pointer hover:scale-110"
            onClick={() => navigate("/dashboard/friends")}
          />

          {/* Requests */}
          <div className="relative">
            <Mail
              className="cursor-pointer hover:scale-110"
              onClick={() => setShowMail(!showMail)}
            />

            {friendRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-2 rounded-full">
                {friendRequests.length}
              </span>
            )}

            {showMail && (
              <div className="absolute right-0 mt-3 w-72 bg-white text-black rounded-xl shadow-xl p-4">
                <h3 className="font-bold mb-2">Friend Requests</h3>

                {friendRequests.length === 0 ? (
                  <p>No requests</p>
                ) : (
                  friendRequests.map((req) => (
                    <div key={req._id} className="flex justify-between mb-2">
                      <span>@{req.requester?.username}</span>
                      <button
                        onClick={() => handleAccept(req._id)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Accept
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <MessageCircle
            className="cursor-pointer hover:scale-110"
            onClick={() => navigate("/dashboard/chat")}
          />

          {/* Profile */}
          <div className="relative">
            <User
              className="cursor-pointer hover:scale-110"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            />

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 bg-white text-black p-4 rounded-xl shadow-xl w-44">
                <p className="font-semibold">@{user.username}</p>

                <button
                  onClick={handleLogout}
                  className="mt-3 flex items-center gap-2 text-red-600"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== USERS GRID ===== */}
      <div className="p-4 md:p-8">

        {allUsers.length === 0 ? (
          <div className="text-center mt-20 opacity-80">
            <Users size={60} className="mx-auto mb-4 opacity-60" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="
            grid gap-5
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          ">
            {allUsers.map((usr) => (
              <div
                key={usr._id}
                className="
                  bg-white/15
                  backdrop-blur-xl
                  rounded-2xl
                  p-5
                  shadow-lg
                  hover:scale-105
                  transition
                  flex flex-col gap-3
                "
              >
                <div>
                  <h4 className="font-bold text-lg">@{usr.username}</h4>
                  <p className="text-sm opacity-80 truncate">
                    {usr.email}
                  </p>
                </div>

                <button
                  onClick={() => handleAddFriend(usr._id)}
                  disabled={sendingId === usr._id}
                  className="
                    mt-auto
                    bg-yellow-400
                    text-black
                    py-2
                    rounded-full
                    font-semibold
                    hover:bg-yellow-300
                  "
                >
                  {sendingId === usr._id ? "Sending..." : "Add Friend"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
