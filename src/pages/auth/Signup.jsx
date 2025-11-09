/* eslint-disable no-unused-vars */
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../Services/api";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { name, email, password, username } = form; // ✅ Extract only valid fields
      await api.post(
        "https://chat-application-backend-0x84.onrender.com/api/auth/register",
        {
          name,
          email,
          password,
          username,
        }
      ); // ✅ Exact names
      navigate("https://chat-application-backend-0x84.onrender.com/login");
    } catch (err) {
      setError("Something went wrong. Try again.");
      console.error(err);
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
        <h2 className="text-4xl font-extrabold text-center text-white mb-4">
          Create Your <span className="text-yellow-400">ChatVerse</span> Account
        </h2>
        <p className="text-center text-gray-200 mb-6">
          Join the world of smart, real-time conversations 🚀
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-gray-200 mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Username (unique ID)"
              className="w-full border p-2 mb-3 rounded"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-200 mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-200 mb-2">Password</label>
            <input
              type="password"
              placeholder="Create password"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-200 mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Button */}
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
                <span>Creating...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </motion.button>
        </form>

        {/* Already have account */}
        <div className="text-center mt-6 text-gray-300">
          Already have an account?{" "}
          <button
            onClick={() =>
              navigate(
                "https://chat-application-backend-0x84.onrender.com/login"
              )
            }
            className="text-yellow-400 font-semibold hover:underline transition"
          >
            Log in
          </button>
        </div>
      </motion.div>
    </div>
  );
}
