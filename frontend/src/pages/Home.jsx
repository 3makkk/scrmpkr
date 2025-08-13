import React, { useState } from 'react';
import { useAuth } from '../AuthProvider';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../socket';

export default function Home() {
  const { account, login, getToken } = useAuth();
  const navigate = useNavigate();
  const [joiningId, setJoiningId] = useState('');

  const createRoom = async () => {
    const token = await getToken();
    const socket = getSocket(token);
    socket.emit('room:create', {}, ({ roomId }) => {
      navigate(`/r/${roomId}`);
    });
  };

  const joinRoom = async () => {
    navigate(`/r/${joiningId}`);
  };

  return (
    <div className="p-4">
      {!account && <button onClick={login} className="btn">Login</button>}
      {account && (
        <div className="space-y-4">
          <button onClick={createRoom} className="btn">Create Room</button>
          <div>
            <input value={joiningId} onChange={e=>setJoiningId(e.target.value)} placeholder="Room ID" className="border p-1" />
            <button onClick={joinRoom} className="btn ml-2">Join</button>
          </div>
        </div>
      )}
    </div>
  );
}
