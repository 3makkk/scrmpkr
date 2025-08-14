import React, { useState } from "react";

type Props = {
  title: string;
  subtitle?: string;
  onLogin: (name: string) => void;
  primaryButtonText?: string;
  secondaryButton?: React.ReactNode;
  autoFocus?: boolean;
};

export default function LoginForm({
  title,
  subtitle,
  onLogin,
  primaryButtonText = "Enter",
  secondaryButton = null,
  autoFocus = false,
}: Props) {
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && name.trim()) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="mb-10">
          <h1 className="text-4xl font-light text-white mb-3">{title}</h1>
          <p className="text-white/70 text-lg">{subtitle}</p>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-3 text-left">
              Your name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input w-full"
              onKeyPress={handleKeyPress}
              autoFocus={autoFocus}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={!name.trim()}
              className="btn w-full"
            >
              {primaryButtonText}
            </button>

            {secondaryButton}
          </div>
        </div>
      </div>
    </div>
  );
}
