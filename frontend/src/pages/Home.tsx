import { useState } from "react";
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
  const [joiningId, setJoiningId] = useState("");

  const createRoom = () => {
    if (!account) return;
    const s = getSocket({ name: account.name, userId: account.id });
    s.emit("room:create", { name: account.name }, ({ roomId }) => {
      navigate(`/r/${roomId}`);
    });
  };

  const joinRoom = () => {
    navigate(`/r/${joiningId}`);
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

        <div className="space-y-10">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-200 mb-6">
              Start a new session
            </h2>
            <Button type="button" onClick={createRoom} className="w-full">
              Create New Room
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-6 bg-gray-900/60 text-gray-400">or</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-medium text-gray-200 mb-6 text-center">
              Join existing room
            </h2>
            <div className="space-y-4">
              <input
                value={joiningId}
                onChange={(e) => setJoiningId(e.target.value)}
                placeholder="Enter Room ID"
                className="input w-full text-center"
                onKeyDown={(e) =>
                  e.key === "Enter" && joiningId.trim() && joinRoom()
                }
              />
              <Button
                type="button"
                onClick={joinRoom}
                disabled={!joiningId.trim()}
                variant="secondary"
                className="w-full"
              >
                Join Room
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
