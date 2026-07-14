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
  const { currentRoomId, roomState, updateRole } = useRoom();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);

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

  const handleChangeRole = () => {
    setIsMenuOpen(false);
    setIsEditingRole(true);
  };

  const handleRoleSelected = (newRole: UserRole) => {
    updateRole(newRole);
    setIsEditingRole(false);
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

          <button
            type="button"
            onClick={handleChangeRole}
            className="w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm transition-colors duration-150 hover:bg-gray-700 hover:text-white"
            data-testid="change-role-button"
          >
            Change role
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

      <Modal
        open={isEditingRole}
        onClose={() => setIsEditingRole(false)}
        data-testid="role-edit-overlay"
      >
        <Card className="w-md">
          <div className="mb-6">
            <h2 className="mb-2 font-medium text-2xl text-white">Change Role</h2>
            <p className="text-gray-400">
              Switch how you take part in this session
            </p>
          </div>
          <div className="space-y-3">
            {(
              [
                {
                  role: UserRole.PARTICIPANT,
                  title: "Participant",
                  desc: "Vote in planning sessions and see results",
                  icon: "🗳️",
                  current: "border-blue-500 bg-blue-500/10",
                  hover: "hover:border-blue-500/60 hover:bg-blue-500/5",
                  ring: "bg-blue-500/15 text-blue-300",
                  testid: "role-option-participant",
                },
                {
                  role: UserRole.FACILITATOR,
                  title: "Facilitator",
                  desc: "Manage the session (reveal and start rounds) without voting",
                  icon: "🎬",
                  current: "border-amber-500 bg-amber-500/10",
                  hover: "hover:border-amber-500/60 hover:bg-amber-500/5",
                  ring: "bg-amber-500/15 text-amber-300",
                  testid: "role-option-facilitator",
                },
                {
                  role: UserRole.VISITOR,
                  title: "Visitor",
                  desc: "Observe the session without voting",
                  icon: "👁",
                  current: "border-purple-500 bg-purple-500/10",
                  hover: "hover:border-purple-500/60 hover:bg-purple-500/5",
                  ring: "bg-purple-500/15 text-purple-300",
                  testid: "role-option-visitor",
                },
              ] as const
            ).map((opt) => {
              const isCurrent = userRole === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleRoleSelected(opt.role)}
                  disabled={isCurrent}
                  aria-current={isCurrent}
                  data-testid={opt.testid}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                    isCurrent
                      ? `${opt.current} cursor-default text-white`
                      : `border-gray-600 bg-gray-800/40 text-gray-300 ${opt.hover}`
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${opt.ring}`}
                    aria-hidden="true"
                  >
                    {opt.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{opt.title}</span>
                      {isCurrent && (
                        <span
                          className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-200 uppercase tracking-wide"
                          data-testid={`${opt.testid}-current`}
                        >
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </Modal>
    </>
  );
}
