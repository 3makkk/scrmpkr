import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import PageLayout from "../components/core/layout/PageLayout";
import Card from "../components/poker/shared/Card";
import Button from "../components/ds/Button/Button";
import { getSocket } from "../socket";
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
    const s = getSocket({ name: account.name, userId: account.id });
    s.emit("room:create", { roomName: sanitized }, (response) => {
      if ("error" in response) {
        setCreateError(response.error);
        return;
      }
      setRoomName("");
      navigate(`/r/${response.roomId}`, { viewTransition: true });
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
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
            delay: 0.1,
          }}
        >
          <motion.h1
            className="text-4xl font-light text-white mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: 0.2,
            }}
          >
            Scrum Poker
          </motion.h1>
          <motion.p
            className="text-gray-400 mb-4"
            data-testid="welcome-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.3,
            }}
          >
            Welcome back,{" "}
            <span className="font-semibold text-blue-400">{account.name}</span>
          </motion.p>
        </motion.div>

        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
            delay: 0.4,
          }}
        >
          {!showCustomForm ? (
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.1,
                  },
                },
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <Button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  className="w-full"
                  data-testid="create-custom-room-button"
                >
                  Create custom Room
                </Button>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <Button
                  type="button"
                  onClick={createRandomRoom}
                  variant="secondary"
                  className="w-full"
                  data-testid="create-random-room-button"
                >
                  Create Random Room
                </Button>
              </motion.div>
              <motion.p
                className="text-sm text-gray-500 text-center"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                Custom lets you pick a readable room name to share; Random
                instantly creates a room with a generated ID.
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
            >
              <motion.h2
                className="text-lg font-medium text-gray-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                Choose your room name
              </motion.h2>
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label
                  htmlFor="custom-room-name"
                  className="block text-sm text-gray-400 sr-only"
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
                <p className="text-xs text-gray-500">
                  Allowed: a-z, hyphen (-), underscore (_). Max 50 characters.
                </p>
              </motion.div>
              {createError && (
                <motion.p
                  className="text-sm text-red-500"
                  role="alert"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                >
                  {createError}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  type="button"
                  onClick={createNamedRoom}
                  className="w-full"
                  disabled={!roomName}
                  data-testid="create-room-submit-button"
                >
                  Create custom Room
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </Card>
    </PageLayout>
  );
}
