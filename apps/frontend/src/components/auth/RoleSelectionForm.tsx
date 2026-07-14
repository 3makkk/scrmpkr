import { useState } from "react";
import { UserRole } from "@scrmpkr/shared";
import Button from "../ds/Button/Button";
import Card from "../ds/Card/Card";
import RoleOptionCard from "./RoleOptionCard";
import { ROLE_OPTIONS } from "./roleOptions";

type Props = {
  readonly roomId: string;
  readonly onJoin: (role: UserRole) => void;
  readonly onCancel?: () => void;
};

export default function RoleSelectionForm({ roomId, onJoin, onCancel }: Props) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    UserRole.PARTICIPANT,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(selectedRole);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="mb-4 font-light text-3xl text-white">Join Room</h1>
          <p className="mb-2 text-gray-400 text-lg">
            Room: <span className="font-medium text-white">{roomId}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Choose how you'd like to participate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3 text-left">
            {ROLE_OPTIONS.map((opt) => (
              <RoleOptionCard
                key={opt.role}
                option={opt}
                selected={selectedRole === opt.role}
                onSelect={() => setSelectedRole(opt.role)}
                testid={`role-${opt.role}-option`}
              />
            ))}
          </div>

          <div className="animation-delay-400 flex animate-fade-in-down flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="submit"
              className="sm:min-w-[120px]"
              data-testid="role-selection-join-button"
            >
              Join Room
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="sm:min-w-[120px]"
                data-testid="role-selection-cancel-button"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
