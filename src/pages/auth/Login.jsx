import { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import api from "../../Services/api.js";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function Login() {

  

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);

  /* 🔒 BLOCK LOGIN PAGE IF USER IS ALREADY AUTHENTICATED */
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }



  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      if (!token || !user) {
        setError("Invalid response from server. Please try again.");
        setLoading(false);
        return;
      }

      // ✅ Save auth
      login(user, token);

      // ✅ REMOVE LOGIN FROM HISTORY (CRITICAL)
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-4xl font-extrabold text-center text-white mb-6">
          Welcome to <span className="text-yellow-400">ChatVerse</span>
        </h2>

        <p className="text-center text-gray-200 mb-8">
          Sign in to continue your conversations 💬
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-200 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            type="submit"
            className={`w-full py-3 rounded-lg font-bold transition ${
              loading
                ? "bg-yellow-300 cursor-not-allowed"
                : "bg-yellow-400 hover:bg-yellow-300 text-black"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>
        </form>

        <div className="text-center mt-4 text-gray-300">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-yellow-400 font-semibold hover:underline"
          >
            Create one
          </button>
        </div>
      </motion.div>
    </div>
  );
} 
