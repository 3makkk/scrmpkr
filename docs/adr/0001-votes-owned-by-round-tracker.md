# Cast votes are owned by the Round, independent of participant presence

A cast vote is recorded in the current Round tracker as a `{ id, name, value }`
snapshot, separate from the live participants map. Removing a participant
(leaving, disconnecting) or changing their role never touches that snapshot, so
a vote survives its caster leaving or switching to a non-voting role, and is
only dropped when the next Round starts.

We decided this for two reasons:

1. **Revealed results must not break when a voter leaves.** Because the Round
   snapshots the voter's name alongside the value, a revealed result stays
   intact and correctly labelled even if the voter is gone from the room.
2. **Estimate integrity.** Once cast, an estimate is a recorded fact for that
   Round. A voter cannot quietly retract an inconvenient number by leaving or
   switching role.

## Consequences

- Vote counts can show totals like "2/1 voted" — a vote can outlive its
  caster's status as an active voter. This is expected, not a bug. Vote-count
  denominators are computed from *current* voters (`canVote(role)`), while the
  numerator comes from the Round snapshot, so the two can legitimately diverge.
- Do not "fix" this by clearing votes on leave/disconnect/role-change: that
  would reintroduce broken reveals and let people retract estimates.
</content>
