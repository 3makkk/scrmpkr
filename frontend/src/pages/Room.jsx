import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { getSocket } from '../socket';

const DECK = [0,1,2,3,5,8,13,21,34,55,'?'];

export default function Room(){
  const { roomId } = useParams();
  const { account } = useAuth();
  const [socket, setSocket] = useState(null);
  const [state, setState] = useState(null);
  const [progress, setProgress] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [revealed, setRevealed] = useState(null);

  useEffect(() => {
    if (!account) return;
    const s = getSocket({ name: account.name, userId: account.id });
    setSocket(s);
    s.emit('room:join',{ roomId }, ({ state }) => setState(state));
    s.on('room:state', setState);
    s.on('vote:progress', setProgress);
    s.on('reveal:countdown', ({remaining})=>setCountdown(remaining));
    s.on('reveal:complete', ({revealedVotes, unanimousValue})=>{
      setRevealed(revealedVotes);
      if(unanimousValue!==undefined){
        import('canvas-confetti').then(m=>m.default());
      }
    });
    s.on('votes:cleared', ()=>{ setRevealed(null); setCountdown(null); });
  }, [roomId, account]);

  const cast = value => socket.emit('vote:cast',{ roomId, value });
  const reveal = () => socket.emit('reveal:start',{ roomId });
  const clear = () => socket.emit('vote:clear',{ roomId });

  if(!state) return <div>Loading...</div>;
  const isOwner = account && account.id === state.ownerId;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl">Room {roomId}</h1>
      <div>
        Participants:
        <ul>
          {state.participants.map(p=> <li key={p.id}>{p.name} {progress[p.id] && '✅'}</li>)}
        </ul>
      </div>
      {revealed && (
        <div>
          Revealed:
          <ul>{revealed.map(r=> <li key={r.id}>{r.id}: {r.value}</li>)}</ul>
        </div>
      )}
      {countdown!==null && <div>Revealing in {countdown}</div>}
      {!revealed && (
        <div className="flex space-x-2">
          {DECK.map(v=> <button key={v} onClick={()=>cast(v)} className="border p-2">{v}</button>)}
        </div>
      )}
      {isOwner && (
        <div className="space-x-2">
          <button onClick={reveal} className="btn">Reveal</button>
          <button onClick={clear} className="btn">Clear</button>
        </div>
      )}
    </div>
  );
}
