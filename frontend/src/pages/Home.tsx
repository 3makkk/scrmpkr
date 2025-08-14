import { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket";
import LoginForm from "../components/LoginForm";
import PageLayout from "../components/PageLayout";
import Card from "../components/Card";

export default function Home() {
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const [joiningId, setJoiningId] = useState("");

  const createRoom = () => {
    if (!account) return;
    const socket = getSocket({ name: account.name, userId: account.id });
    socket.emit("room:create", { name: account.name }, ({ roomId }) => {
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
        secondaryButton={
          <button
            type="button"
            disabled
            className="btn-secondary w-full opacity-50 cursor-not-allowed"
          >
            Azure Login (coming soon)
          </button>
        }
      />
    );
  }

  return (
    <PageLayout className="flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-white mb-2">Scrum Poker</h1>
          <p className="text-white/70 mb-4">
            Welcome back,{" "}
            <span className="font-medium text-slate-300">{account.name}</span>
          </p>
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-lg font-medium text-white/90 mb-6">
              Start a new session
            </h2>
            <button type="button" onClick={createRoom} className="btn w-full">
              Create New Room
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-white/50">
                or
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-white/90 mb-6 text-center">
              Join existing room
            </h2>
            <div className="space-y-4">
              <input
                value={joiningId}
                onChange={(e) => setJoiningId(e.target.value)}
                placeholder="Enter Room ID"
                className="input w-full text-center"
                onKeyPress={(e) =>
                  e.key === "Enter" && joiningId.trim() && joinRoom()
                }
              />
              <button
                type="button"
                onClick={joinRoom}
                disabled={!joiningId.trim()}
                className="btn-secondary w-full"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
