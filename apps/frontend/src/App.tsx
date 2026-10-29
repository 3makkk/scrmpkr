import { BrowserRouter, Route, Routes, useLocation } from "react-router";
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
        <div className="bg-mesh min-h-screen">
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </div>
      </RoomProvider>
    </AuthProvider>
  );
}
