import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider } from "./AuthProvider";
import { RoomProvider } from "./hooks/useRoom";
import Home from "./pages/Home";
import Room from "./pages/Room";

function AnimatedRoutes() {
  const location = useLocation();

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 0.95,
    },
  };

  const pageTransition = {
    duration: 0.4,
    ease: "easeOut" as const,
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Home />
            </motion.div>
          }
        />
        <Route
          path="/r/:roomId"
          element={
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <Room />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
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
