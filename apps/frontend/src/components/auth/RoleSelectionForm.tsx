import { useState } from "react";
import { UserRole } from "@scrmpkr/shared";
import Button from "../ds/Button/Button";
import Card from "../ds/Card/Card";

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
          <div className="space-y-3">
            <label className="animation-delay-200 block animate-fade-in-scale">
              <input
                type="radio"
                name="role"
                value={UserRole.PARTICIPANT}
                checked={selectedRole === UserRole.PARTICIPANT}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="sr-only"
                data-testid="role-participant-radio"
              />
              <div
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  selectedRole === UserRole.PARTICIPANT
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-gray-600 bg-gray-800/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/60"
                }`}
                data-testid="role-participant-option"
              >
                <div className="mb-1 font-medium">Participant</div>
                <div className="text-gray-400 text-sm">
                  Vote in planning sessions and see results
                </div>
              </div>
            </label>

            <label className="animation-delay-300 block animate-fade-in-scale">
              <input
                type="radio"
                name="role"
                value={UserRole.VISITOR}
                checked={selectedRole === UserRole.VISITOR}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="sr-only"
                data-testid="role-visitor-radio"
              />
              <div
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  selectedRole === UserRole.VISITOR
                    ? "border-purple-500 bg-purple-500/10 text-white"
                    : "border-gray-600 bg-gray-800/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/60"
                }`}
                data-testid="role-visitor-option"
              >
                <div className="mb-1 font-medium">Visitor</div>
                <div className="text-gray-400 text-sm">
                  Observe the session without voting
                </div>
              </div>
            </label>
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
