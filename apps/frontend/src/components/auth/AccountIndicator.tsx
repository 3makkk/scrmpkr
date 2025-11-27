import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../AuthProvider";
import { useRoom } from "../../hooks/useRoom";
import UsernameForm from "./UsernameForm";
import Card from "../ds/Card/Card";

export default function AccountIndicator() {
  const { account, login } = useAuth();
  const { currentRoomId, joinRoom } = useRoom();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!account) return null;

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  // Close menu when escape is pressed
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsEditingUsername(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleUsernameChange = (newName: string) => {
    login(newName);
    setIsEditingUsername(false);
    setIsMenuOpen(false);

    // Update username in the current room via socket
    if (currentRoomId && account) {
      // Import socket inside the function to avoid circular dependencies
      import("../../socket").then(({ getCurrentSocket }) => {
        const currentSocket = getCurrentSocket();
        if (currentSocket) {
          currentSocket.emit(
            "user:updateName",
            {
              roomId: currentRoomId,
              newName,
            },
            (
              response: { success: boolean } | { error: string } | undefined,
            ) => {
              if (response && "error" in response) {
                console.error(
                  "Failed to update username in room:",
                  response.error,
                );
              }
            },
          );
        }
      });
    }
  };

  const handleChangeUsername = () => {
    setIsMenuOpen(false);
    setIsEditingUsername(true);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Account Avatar */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          data-testid="account-indicator"
          title={`Logged in as ${account.name}`}
        >
          {getInitials(account.name)}
        </button>

        {/* Context Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
              data-testid="account-menu"
            >
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {getInitials(account.name)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{account.name}</p>
                    <p className="text-gray-400 text-sm">Room participant</p>
                  </div>
                </div>

                <hr className="border-gray-700 mb-4" />

                <button
                  onClick={handleChangeUsername}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-150"
                  data-testid="change-username-button"
                >
                  Change username
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Username Edit Overlay */}
      <AnimatePresence>
        {isEditingUsername && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            data-testid="username-edit-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="max-w-md w-full">
                <div className="mb-6">
                  <h2 className="text-2xl font-medium text-white mb-2">
                    Change Username
                  </h2>
                  <p className="text-gray-400">
                    Choose a new name for this session
                  </p>
                </div>

                <UsernameForm
                  currentName={account.name}
                  onSubmit={handleUsernameChange}
                  onCancel={() => setIsEditingUsername(false)}
                  submitText="Change Name"
                  showCancel={true}
                />
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
