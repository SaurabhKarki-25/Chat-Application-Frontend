import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Services/api";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function FriendsPage() {
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      setLoading(true);

      // ✅ Correct API
      const res = await api.get("/api/friends/list");

      setFriends(res.data || []);
    } catch (err) {
      console.error("FriendsPage error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white">
        Loading Friends...
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-2xl font-extrabold text-yellow-400">Friends</h1>
      </div>

      {/* Friends List */}
      {friends.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
          <p className="text-white/80">No friends yet 😅</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((fr) => (
            <motion.div
              key={fr._id}
              whileHover={{ scale: 1.03 }}
              className="bg-white/15 backdrop-blur-xl rounded-2xl p-5 flex justify-between items-center"
            >
              <div>
                <h4 className="font-bold">@{fr.username}</h4>
                <p className="text-sm">{fr.email}</p>
              </div>

              <button
                onClick={() => navigate("/dashboard/chat")}
                className="bg-yellow-400 text-black px-3 py-2 rounded-xl flex items-center gap-2 font-semibold"
              >
                <MessageCircle size={18} /> Chat
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
