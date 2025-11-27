import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../AuthProvider";
import { useRoom } from "../../hooks/useRoom";
import { UserRole } from "@scrmpkr/shared";
import UsernameForm from "./UsernameForm";
import Card from "../ds/Card/Card";

export default function AccountIndicator() {
  const { account, updateName } = useAuth();
  const { currentRoomId, roomState } = useRoom();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Get user avatar color based on role
  const getAvatarColor = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER:
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      case UserRole.PARTICIPANT:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
      case UserRole.VISITOR:
        return "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500";
      default:
        return "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500";
    }
  };

  // Get role display text
  const getRoleDisplayText = (role: UserRole) => {
    switch (role) {
      case UserRole.OWNER:
        return "Room Owner";
      case UserRole.PARTICIPANT:
        return "Participant";
      case UserRole.VISITOR:
        return "Visitor";
      default:
        return "Unknown Role";
    }
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

  if (!account || !roomState) return null;

  // Find current user in room participants to get their role
  const currentUser = roomState.participants.find((p) => p.id === account.id);
  const userRole = currentUser?.role || UserRole.PARTICIPANT;

  const handleUsernameChange = (newName: string) => {
    updateName(newName);
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
              response: { success: boolean } | { error: string } | undefined
            ) => {
              if (response && "error" in response) {
                console.error(
                  "Failed to update username in room:",
                  response.error
                );
              }
            }
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
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${getAvatarColor(
            userRole
          )}`}
          data-testid="account-indicator"
          title={`Logged in as ${account.name} (${getRoleDisplayText(
            userRole
          )})`}
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
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      getAvatarColor(userRole).split(" ")[0]
                    }`}
                  >
                    {getInitials(account.name)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{account.name}</p>
                    <p className="text-gray-400 text-sm">
                      {getRoleDisplayText(userRole)}
                    </p>
                  </div>
                </div>

                <hr className="border-gray-700 mb-4" />

                <button
                  type="button"
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
              <Card className="w-md">
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
