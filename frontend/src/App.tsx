import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import { RoomProvider } from "./hooks/useRoom";
import Home from "./pages/Home";
import Room from "./pages/Room";

export default function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <div className="min-h-screen bg-black text-white">
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
