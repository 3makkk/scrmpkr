import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import { RoomProvider } from "./hooks/useRoom";
import Home from "./pages/Home";
import Room from "./pages/Room";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/r/:roomId" element={<Room />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950">
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </div>
      </RoomProvider>
    </AuthProvider>
  );
}
