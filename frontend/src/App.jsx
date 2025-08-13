import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import { RoomProvider } from "./hooks/useRoom.jsx";
import Home from "./pages/Home";
import Room from "./pages/Room";

export default function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/r/:roomId" element={<Room />} />
            </Routes>
          </BrowserRouter>
        </div>
      </RoomProvider>
    </AuthProvider>
  );
}
