import { useState } from "react";
import Button from "../ds/Button/Button";
import Input from "../ds/Input/Input";

type Props = {
  readonly currentName?: string;
  readonly onSubmit: (name: string) => void;
  readonly onCancel?: () => void;
  readonly submitText?: string;
  readonly showCancel?: boolean;
};

export default function UsernameForm({
  currentName = "",
  onSubmit,
  onCancel,
  submitText = "Save",
  showCancel = false,
}: Props) {
  const [name, setName] = useState(currentName);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      handleSubmit();
    } else if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="username"
          className="block text-gray-300 text-sm font-medium mb-3"
        >
          Your name
        </label>
        <Input
          id="username"
          data-testid="user-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full"
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="flex-1"
          data-testid="login-button"
        >
          {submitText}
        </Button>

        {showCancel && onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
            data-testid="username-cancel"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
