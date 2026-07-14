# Scrum Poker (scrmpkr)

Real-time planning-poker estimation. People join a shared space, cast estimate
cards, and reveal them together to reach consensus.

## Language

**Room**:
The persistent shared space people join, identified by a room id (`RoomState`).
A Room holds its participants and the current Round. It lives until the last
participant leaves.
_Avoid_: Session, Game, Lobby

**Round**:
One voting cycle within a Room (`RoundState`): collect votes, then reveal them.
"Start the next Round" (clear) begins a fresh cycle with the same participants.
_Avoid_: Session, Turn

**Participant**:
A person in a Room who can cast votes. One of the three `UserRole` values.
_Avoid_: Voter (informal only), User

**Visitor**:
A person in a Room who only observes — cannot vote and cannot control the Round.
_Avoid_: Observer, Spectator

**Facilitator**:
A person in a Room who manages the Round (reveal, start next Round, delete the
Room) but does not vote. A non-voting manager; control is shared with
Participants, not exclusive.
_Avoid_: Scrum Master, Moderator, Owner

**Vote**:
An estimate cast by a Participant in a Round, snapshotted as `{ id, name, value }`
in the Round. Once cast, it is a recorded fact for that Round (see ADR-0001).
_Avoid_: Estimate (informal only), Point

**Reveal**:
The action that flips a Round from "voting" to "revealed", showing all Votes and
their stats.
_Avoid_: Show, Flip

## Flagged ambiguities

**"Session"** — avoid this word. Speakers use it loosely for both the **Room**
(the persistent space) and a **Round** (one voting cycle). In particular,
"start a new session" means "start the next **Round**", not create a new Room.
There is no `Session` type in the code.

## Example dialogue

> **Dev:** If a Participant closes their tab after we reveal, does the result change?
>
> **Domain expert:** No. Once they cast a Vote it belongs to the Round, name and
> all, so the revealed result stays intact. They only drop out when we start the
> next Round.
>
> **Dev:** And a Facilitator — they're in the Room but not in that count?
>
> **Domain expert:** Right. A Facilitator manages the Round but never votes, so
> they never appear in the "voted" tally, same as a Visitor.
</content>
