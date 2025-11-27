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
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white mb-4">Join Room</h1>
          <p className="text-gray-400 text-lg mb-2">
            Room: <span className="text-white font-medium">{roomId}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Choose how you'd like to participate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block">
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
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRole === UserRole.PARTICIPANT
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-gray-600 bg-gray-800/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/60"
                }`}
                data-testid="role-participant-option"
              >
                <div className="font-medium mb-1">Participant</div>
                <div className="text-sm text-gray-400">
                  Vote in planning sessions and see results
                </div>
              </div>
            </label>

            <label className="block">
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
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRole === UserRole.VISITOR
                    ? "border-purple-500 bg-purple-500/10 text-white"
                    : "border-gray-600 bg-gray-800/40 text-gray-300 hover:border-gray-500 hover:bg-gray-800/60"
                }`}
                data-testid="role-visitor-option"
              >
                <div className="font-medium mb-1">Visitor</div>
                <div className="text-sm text-gray-400">
                  Observe the session without voting
                </div>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
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
