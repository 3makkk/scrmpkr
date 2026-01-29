import { useState } from "react";
import { useAuth } from "../../AuthProvider";
import { useRoom } from "../../hooks/useRoom";
import { UserRole } from "@scrmpkr/shared";
import UsernameForm from "./UsernameForm";
import UserInfoSection from "./UserInfoSection";
import Card from "../ds/Card/Card";
import Modal from "../ds/Modal/Modal";
import Dropdown from "../ds/Dropdown/Dropdown";
import UserAvatar from "../ds/UserAvatar/UserAvatar";

export default function AccountIndicator() {
  const { account, updateName } = useAuth();
  const { currentRoomId, roomState } = useRoom();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  if (!account || !roomState) return null;

  // Find current user in room participants to get their role
  const currentUser = roomState.participants.find((p) => p.id === account.id);
  const userRole = currentUser?.role || UserRole.PARTICIPANT;

  const handleUsernameChange = (newName: string) => {
    updateName(newName);
    setIsEditingUsername(false);

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
      <Dropdown
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        trigger={({ onClick, className }) => (
          <button
            type="button"
            onClick={onClick}
            className={`focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              className || ""
            }`}
            data-testid="account-indicator"
          >
            <UserAvatar
              name={account.name}
              role={userRole}
              size="md"
              interactive={true}
              showTooltip={true}
            />
          </button>
        )}
      >
        <div className="w-64 p-4" data-testid="account-menu">
          <UserInfoSection
            name={account.name}
            role={userRole}
            className="mb-4"
          />

          <hr className="mb-4 border-gray-700" />

          <button
            type="button"
            onClick={handleChangeUsername}
            className="w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm transition-colors duration-150 hover:bg-gray-700 hover:text-white"
            data-testid="change-username-button"
          >
            Change username
          </button>
        </div>
      </Dropdown>

      <Modal
        open={isEditingUsername}
        onClose={() => setIsEditingUsername(false)}
        data-testid="username-edit-overlay"
      >
        <Card className="w-md">
          <div className="mb-6">
            <h2 className="mb-2 font-medium text-2xl text-white">
              Change Username
            </h2>
            <p className="text-gray-400">Choose a new name for this session</p>
          </div>

          <UsernameForm
            currentName={account.name}
            onSubmit={handleUsernameChange}
            onCancel={() => setIsEditingUsername(false)}
            submitText="Change Name"
            showCancel={true}
          />
        </Card>
      </Modal>
    </>
  );
}
