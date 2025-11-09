import axios from "axios";

const api = axios.create({
  baseURL: "https://chat-application-backend-0x84.onrender.com", // change this if your backend URL is different
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
