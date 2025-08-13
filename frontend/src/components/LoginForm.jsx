import { useState } from "react";

export default function LoginForm({
  title,
  subtitle,
  onLogin,
  primaryButtonText = "Enter",
  secondaryButton = null,
}) {
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const handleKeyPress = (e) => {
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
            <label
              htmlFor="name"
              className="block text-white/70 text-sm font-medium mb-3 text-left"
            >
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="input w-full"
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="space-y-4">
            <button
              type="button"
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
