const { v4: uuid } = require('uuid');

const FIB_DECK = [0,1,2,3,5,8,13,21,34,55,'?'];

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(ownerId, name) {
    const id = uuid();
    const room = {
      id,
      ownerId,
      name,
      participants: new Map(),
      status: 'voting',
      reveals: 0,
      lastRevealAt: Date.now()
    };
    this.rooms.set(id, room);
    room.participants.set(ownerId, { id: ownerId, name: name || 'Owner', hasVoted: false });
    return room;
  }

  joinRoom(id, user) {
    const room = this.rooms.get(id);
    if (!room) throw new Error('Room not found');
    room.participants.set(user.id, { id: user.id, name: user.name, hasVoted: false });
    return room;
  }

  castVote(id, userId, value) {
    const room = this.rooms.get(id);
    if (!room || !FIB_DECK.includes(value)) return;
    const p = room.participants.get(userId);
    if (p) { p.hasVoted = true; p.value = value; }
  }

  clearVotes(id) {
    const room = this.rooms.get(id);
    if (!room) return;
    room.status = 'voting';
    for (const p of room.participants.values()) {
      p.hasVoted = false;
      delete p.value;
    }
  }

  isOwner(id, userId) {
    const room = this.rooms.get(id); return room && room.ownerId === userId;
  }

  getState(id) {
    const room = this.rooms.get(id);
    if (!room) return null;
    return {
      id: room.id,
      ownerId: room.ownerId,
      participants: Array.from(room.participants.values()).map(p => ({ id:p.id, name:p.name, hasVoted:p.hasVoted })),
      status: room.status
    };
  }

  getProgress(id) {
    const room = this.rooms.get(id);
    if (!room) return null;
    const result = {};
    for (const [id,p] of room.participants) result[id]=p.hasVoted;
    return result;
  }

  startReveal(id, namespace) {
    const room = this.rooms.get(id);
    if (!room) return;
    room.status = 'revealing';
    let remaining = 3;
    const interval = setInterval(() => {
      remaining -=1;
      namespace.to(id).emit('reveal:countdown', { remaining });
      if (remaining<=0) {
        clearInterval(interval);
        room.status = 'voting';
        room.reveals +=1;
        room.lastRevealAt = Date.now();
        const revealed = Array.from(room.participants.values()).map(p=>({id:p.id,value:p.value}));
        const vals = revealed.filter(v=>v.value!== '?' && v.value!==undefined).map(v=>v.value);
        const unique = [...new Set(vals)];
        const unanimousValue = unique.length===1 && vals.length>0 ? unique[0]: undefined;
        namespace.to(id).emit('reveal:complete',{revealedVotes:revealed, unanimousValue});
      }
    },1000);
  }

  leaveAll(userId){
    for(const room of this.rooms.values()){
      room.participants.delete(userId);
    }
  }
}

module.exports = { RoomManager, FIB_DECK };
