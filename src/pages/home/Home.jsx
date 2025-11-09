import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-700 flex flex-col text-white">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-6">
        <h1 className="text-3xl font-extrabold tracking-wide">
          Chat<span className="text-yellow-400">Verse</span>
        </h1>
        <nav className="space-x-6 text-lg">
          <button
            onClick={() => navigate("/login")}
            className="hover:text-yellow-400 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-300 font-semibold transition"
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-extrabold leading-tight"
        >
          Connect. Chat. <span className="text-yellow-400">Collaborate.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl mt-4 max-w-2xl text-gray-200"
        >
          Welcome to <span className="font-bold text-yellow-400">ChatVerse</span> — 
          where conversations meet intelligence. 
          Enjoy real-time messaging, AI-powered replies, and smooth communication with your friends or teams.
        </motion.p>

        <motion.button
          onClick={() => navigate("/login")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="mt-8 bg-yellow-400 text-black px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-yellow-300 transition"
        >
          Start Chatting
        </motion.button>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/20 text-sm text-gray-300">
        © {new Date().getFullYear()} ChatVerse. All rights reserved.
      </footer>
    </div>
  );
}
