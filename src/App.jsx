import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/chat/Dashboard";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import  Chatbox from "./pages/chat/Chatpage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
           
              <Dashboard />
            
          }
        />

        <Route
          path="/dashboard/chat"
          element={
          
              <Chatbox />
            
          }
        />



        

        {/* Default route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

