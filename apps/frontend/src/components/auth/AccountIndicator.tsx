import { UserRole } from "@scrmpkr/shared";
import clsx from "clsx";
import { useState } from "react";
import { useAuth } from "../../AuthProvider";
import { useRoom } from "../../hooks/useRoom";
import Card from "../ds/Card/Card";
import Dropdown from "../ds/Dropdown/Dropdown";
import Modal from "../ds/Modal/Modal";
import { focusRing } from "../ds/states";
import UserAvatar from "../ds/UserAvatar/UserAvatar";
import RoleOptionCard from "./RoleOptionCard";
import { ROLE_OPTIONS } from "./roleOptions";
import UserInfoSection from "./UserInfoSection";
import UsernameForm from "./UsernameForm";

export default function AccountIndicator() {
  const { account, updateName } = useAuth();
  const { roomState, updateRole, updateName: updateRoomName } = useRoom();
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

    updateRoomName(newName);
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
            className={clsx("rounded-full", focusRing, className)}
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
            className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-300 transition-colors duration-150 hover:bg-gray-700 hover:text-white"
            data-testid="change-username-button"
          >
            Change username
          </button>

          <button
            type="button"
            onClick={handleChangeRole}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-300 transition-colors duration-150 hover:bg-gray-700 hover:text-white"
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
            <h2 className="mb-2 text-2xl font-medium text-white">
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
            <h2 className="mb-2 text-2xl font-medium text-white">
              Change Role
            </h2>
            <p className="text-gray-400">
              Switch how you take part in this session
            </p>
          </div>
          <div className="space-y-3">
            {ROLE_OPTIONS.map((opt) => {
              const isCurrent = userRole === opt.role;
              return (
                <RoleOptionCard
                  key={opt.role}
                  option={opt}
                  selected={isCurrent}
                  disabled={isCurrent}
                  badge={isCurrent ? "Current" : undefined}
                  onSelect={() => handleRoleSelected(opt.role)}
                  testid={`role-option-${opt.role}`}
                />
              );
            })}
          </div>
        </Card>
      </Modal>
    </>
  );
}
