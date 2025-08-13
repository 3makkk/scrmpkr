import React, { useState } from 'react';
import { useAuth } from '../AuthProvider';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../socket';

export default function Home() {
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const [joiningId, setJoiningId] = useState('');
  const [name, setName] = useState('');

  const createRoom = () => {
    const socket = getSocket({ name: account.name, userId: account.id });
    socket.emit('room:create', { name: account.name }, ({ roomId }) => {
      navigate(`/r/${roomId}`);
    });
  };

  const joinRoom = () => {
    navigate(`/r/${joiningId}`);
  };

  if (!account) {
    return (
      <div className="p-4 space-y-4">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="border p-1" />
        <button onClick={()=>login(name)} className="btn">Enter</button>
        <button disabled className="btn opacity-50 cursor-not-allowed">Azure Login (coming soon)</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <button onClick={createRoom} className="btn">Create Room</button>
      <div>
        <input value={joiningId} onChange={e=>setJoiningId(e.target.value)} placeholder="Room ID" className="border p-1" />
        <button onClick={joinRoom} className="btn ml-2">Join</button>
      </div>
    </div>
  );
}
