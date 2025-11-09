import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../Services/api.js";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function Login() {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // ✅ Context for user auth state

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
     const res = await api.post("https://chat-application-backend-0x84.onrender.com/api/auth/login", { email, password });

      // ✅ Expect backend to return both token and user object
      const { token, user } = res.data;

      if (!token || !user) {
        setError("Invalid response from server. Please try again.");
        console.error("Invalid backend response:", res.data);
        return;
      }

      // ✅ Store token + user, update global context
      login(user, token);

      // ✅ Navigate to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Login failed:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
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
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-lg bg-yellow-400 text-black font-bold shadow-md hover:bg-yellow-300 transition"
          >
            {loading ? (
              <div className="flex justify-center items-center space-x-2">
                <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </motion.button>
        </form>

        <div className="text-center mt-5">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-gray-200 hover:text-yellow-300 transition"
          >
            Forgot password?
          </button>
        </div>

        <div className="text-center mt-4 text-gray-300">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-yellow-400 font-semibold hover:underline transition"
          >
            Create one
          </button>
        </div>
      </motion.div>
    </div>
  );
}
