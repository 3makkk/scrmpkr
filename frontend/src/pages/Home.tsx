import { useEffect, useRef, useState } from "react";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import PageLayout from "../components/PageLayout";
import Card from "../components/Card";
import Button from "../components/ds/Button/Button";
import { getSocket } from "../socket";

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
    const s = getSocket({ name: account.name, userId: account.id });
    s.emit("room:create", { roomName: sanitized }, (response) => {
      if ("error" in response) {
        setCreateError(response.error);
        return;
      }
      setRoomName("");
      navigate(`/r/${response.roomId}`);
    });
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
      <Card className="max-w-lg w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light text-white mb-3">Scrum Poker</h1>
          <p className="text-gray-400 mb-4">
            Welcome back,{" "}
            <span className="font-semibold text-blue-400">{account.name}</span>
          </p>
        </div>

        <div className="space-y-8">
          {!showCustomForm ? (
            <div className="space-y-4">
              <Button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full"
              >
                Create custom Room
              </Button>
              <Button
                type="button"
                onClick={createRandomRoom}
                variant="secondary"
                className="w-full"
              >
                Create Random Room
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Custom lets you pick a readable room name to share; Random
                instantly creates a room with a generated ID.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-200">
                Choose your room name
              </h2>
              <div className="space-y-3">
                <label
                  htmlFor="custom-room-name"
                  className="block text-sm text-gray-400 sr-only"
                >
                  Custom room name
                </label>
                <input
                  id="custom-room-name"
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
                <p className="text-xs text-gray-500">
                  Allowed: a-z, hyphen (-), underscore (_). Max 50 characters.
                </p>
              </div>
              {createError && (
                <p className="text-sm text-red-500" role="alert">
                  {createError}
                </p>
              )}
              <Button
                type="button"
                onClick={createNamedRoom}
                className="w-full"
                disabled={!roomName}
              >
                Create custom Room
              </Button>
            </div>
          )}
        </div>
      </Card>
    </PageLayout>
  );
}
