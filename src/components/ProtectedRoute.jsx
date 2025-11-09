import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  // Wait while verifying
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white">
        <div className="animate-spin h-10 w-10 border-t-4 border-yellow-400 rounded-full"></div>
      </div>
    );
  }

  // If token exists, stay logged in (no redirect)
  if (token) return children;

  // No token = go to login
  return <Navigate to="/login" replace />;
}
