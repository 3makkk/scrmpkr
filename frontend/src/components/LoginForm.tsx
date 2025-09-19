import { useState } from "react";
import Button from "./ds/Button/Button";

type Props = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onLogin: (name: string) => void;
  readonly primaryButtonText?: string;
  readonly secondaryButton?: React.ReactNode;
};

export default function LoginForm({
  title,
  subtitle,
  onLogin,
  primaryButtonText = "Enter",
  secondaryButton = null,
}: Props) {
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="mb-12">
          <h1 className="text-4xl font-light text-white mb-4">{title}</h1>
          <p className="text-gray-400 text-lg">{subtitle}</p>
        </div>

        <div className="space-y-8">
          <div>
            <label
              htmlFor="name"
              className="block text-gray-300 text-sm font-medium mb-4 text-left"
            >
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input w-full"
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              onClick={handleLogin}
              disabled={!name.trim()}
              className="w-full"
            >
              {primaryButtonText}
            </Button>

            {secondaryButton}
          </div>
        </div>
      </div>
    </div>
  );
}
