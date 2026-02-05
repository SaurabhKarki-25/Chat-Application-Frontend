import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Services/api";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react";

export default function RequestsPage() {
  const navigate = useNavigate();

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);

      const [receivedRes, sentRes] = await Promise.all([
        api.get("/api/friends/pending/received"),
        api.get("/api/friends/pending/sent"),
      ]);

      setReceivedRequests(receivedRes.data || []);
      setSentRequests(sentRes.data || []);
    } catch (err) {
      console.error("RequestsPage error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Optional auto refresh every 40 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
    }, 40000);

    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    try {
      await api.put(`/api/friends/accept/${requestId}`);
      fetchRequests();
    } catch (err) {
      console.error("Accept error:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "Failed to accept request!");
    }
  };

  // Backend not created yet
  const handleReject = () => {
    alert("Reject API not added yet. Tell me to add it.");
  };

  const handleCancel = () => {
    alert("Cancel API not added yet. Tell me to add it.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white">
        Loading Requests...
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

        <h1 className="text-2xl font-extrabold text-yellow-400">Requests</h1>
      </div>

      {/* Received Requests */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-6">
        <h2 className="text-lg font-bold mb-4">
          📥 Received Requests ({receivedRequests.length})
        </h2>

        {receivedRequests.length === 0 ? (
          <p className="text-white/80">No incoming requests.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {receivedRequests.map((req) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/15 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">@{req.requester?.username}</p>
                  <p className="text-sm text-white/70">
                    {req.requester?.email}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req._id)}
                    className="bg-green-500 text-black px-3 py-2 rounded-xl flex items-center gap-1 font-semibold"
                  >
                    <CheckCircle size={16} /> Accept
                  </button>

                  <button
                    onClick={handleReject}
                    className="bg-red-500 text-white px-3 py-2 rounded-xl flex items-center gap-1 font-semibold"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">
          📤 Sent Requests ({sentRequests.length})
        </h2>

        {sentRequests.length === 0 ? (
          <p className="text-white/80">No pending sent requests.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sentRequests.map((req) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/15 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">@{req.recipient?.username}</p>
                  <p className="text-sm text-white/70">
                    {req.recipient?.email}
                  </p>
                </div>

                <button
                  onClick={handleCancel}
                  className="bg-yellow-400 text-black px-3 py-2 rounded-xl flex items-center gap-1 font-semibold"
                >
                  <Send size={16} /> Cancel
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
