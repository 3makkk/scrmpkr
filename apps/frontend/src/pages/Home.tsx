import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import PageLayout from "../components/core/layout/PageLayout";
import Card from "../components/poker/shared/Card";
import Button from "../components/ds/Button/Button";
import { checkRoomExists } from "../socket";
import { Input } from "../components";

export default function Home() {
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const customInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showCustomForm) {
      customInputRef.current?.focus();
    }
  }, [showCustomForm]);

  const sanitizeRoomName = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z_-]/g, "")
      .slice(0, 50);

  const generateRandomRoomId = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz_-";
    const length = 12;
    let value = "";
    for (let i = 0; i < length; i += 1) {
      value += chars[Math.floor(Math.random() * chars.length)];
    }
    return value;
  };

  const createRoom = (name: string) => {
    if (!account) return;
    const sanitized = sanitizeRoomName(name);
    if (!sanitized) {
      setCreateError("Room name is required");
      return;
    }
    setCreateError(null);

    // Check if room already exists
    checkRoomExists(
      {
        name: account.name,
        userId: account.id,
      },
      sanitized,
      (exists) => {
        if (exists) {
          setCreateError(`Room "${sanitized}" already exists.`);
        } else {
          navigate(`/r/${sanitized}`);
        }
      },
    );
  };

  const createNamedRoom = () => {
    createRoom(roomName);
  };

  const createRandomRoom = () => {
    setCreateError(null);
    createRoom(generateRandomRoomId());
  };

  if (!account) {
    return (
      <LoginForm
        title="Scrum Poker"
        subtitle="Collaborative estimation made simple"
        onLogin={login}
        primaryButtonText="Enter"
      />
    );
  }

  return (
    <PageLayout className="flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <div className="mb-10 animate-fade-in-down text-center">
          <h1 className="animation-delay-100 mb-3 animate-fade-in-scale font-light text-4xl text-white">
            Scrum Poker
          </h1>
          <p
            className="animation-delay-200 mb-4 animate-fade-in-scale text-gray-400"
            data-testid="welcome-message"
          >
            Welcome back,{" "}
            <span className="font-semibold text-blue-400">{account.name}</span>
          </p>
        </div>

        <div className="animation-delay-300 animate-fade-in-scale space-y-8">
          {!showCustomForm ? (
            <div className="space-y-4">
              <Button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full"
                data-testid="create-custom-room-button"
              >
                Create custom Room
              </Button>

              <Button
                type="button"
                onClick={createRandomRoom}
                variant="secondary"
                className="w-full"
                data-testid="create-random-room-button"
              >
                Create Random Room
              </Button>
              <p className="animation-delay-150 animate-fade-in-down text-center text-gray-500 text-sm">
                Custom lets you pick a readable room name to share; Random
                instantly creates a room with a generated ID.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in-scale space-y-6">
              <h2 className="animation-delay-100 animate-slide-in-left font-medium text-gray-200 text-lg">
                Choose your room name
              </h2>
              <div className="space-y-3">
                <label
                  htmlFor="custom-room-name"
                  className="sr-only block text-gray-400 text-sm"
                >
                  Custom room name
                </label>
                <Input
                  id="custom-room-name"
                  data-testid="room-name-input"
                  ref={customInputRef}
                  value={roomName}
                  onChange={(e) => {
                    const value = sanitizeRoomName(e.target.value);
                    setRoomName(value);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="e.g. sprint-planning"
                  className="input w-full font-mono"
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createNamedRoom();
                  }}
                />
                <p className="text-gray-500 text-xs">
                  Allowed: a-z, hyphen (-), underscore (_). Max 50 characters.
                </p>
              </div>
              {createError && (
                <p
                  className="animate-bounce-in text-red-500 text-sm"
                  role="alert"
                >
                  {createError}
                </p>
              )}
              <div className="animation-delay-200 animate-fade-in-down">
                <Button
                  type="button"
                  onClick={createNamedRoom}
                  className="w-full"
                  disabled={!roomName}
                  data-testid="create-room-submit-button"
                >
                  Create custom Room
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </PageLayout>
  );
}
