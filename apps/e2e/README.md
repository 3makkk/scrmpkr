# E2E Tests for Scrum Poker

This package contains end-to-end tests for the Scrum Poker application using Playwright.

## Prerequisites

Before running the tests, make sure you have:

1. All dependencies installed: `pnpm install`
2. Playwright browsers installed: `pnpm --filter e2e install-browsers`

## Test Scenarios

### Main Test: `scrum-poker-game.spec.ts`

This test simulates a complete Scrum Poker game session with the following acceptance criteria:

- **5 People play**: Creates 5 initial players (Alice, Bob, Charlie, Diana, Eve) with Alice as the room owner
- **1-2 People join/leave between rounds**:
  - Round 1: All 5 players participate
  - Between rounds: Eve leaves the room
  - Round 2: Two new players (Frank, Grace) join mid-game
  - Between rounds: Bob leaves the room
  - Round 3: Final round with remaining 5 players

### Test Flow

1. **Room Creation**: Alice creates a room and other players join
2. **First Round**: All 5 players vote with different values [1,2,3,5,8]
3. **Results**: Votes are revealed and statistics shown
4. **Player Changes**: Eve leaves, Frank and Grace join
5. **Second Round**: 6 players vote with values [2,3,5,8,1,2]
6. **More Changes**: Bob leaves the room
7. **Final Round**: 5 remaining players vote for consensus [5,5,8,5,5]
8. **Consensus**: Test verifies that consensus is achieved with value 5

### Edge Cases Test

Additional test coverage includes:

- Question mark (?) votes
- Zero value votes
- Single player rooms
- Voting and revealing with minimal participants

## Running Tests

### From workspace root:

```bash
# Run all e2e tests
pnpm test:e2e

# Run tests with UI mode (interactive)
pnpm test:e2e:ui
```

### From e2e package directory:

```bash
cd apps/e2e

# Run tests
pnpm test

# Run with UI mode
pnpm test:ui

# Run in headed mode (see browser)
pnpm test:headed

# Debug mode
pnpm test:debug
```

## Test Configuration

The tests are configured to:

- Run against local development servers (frontend: port 5173, server: port 4000)
- Automatically start the servers before running tests
- Test against Chromium, Firefox, and WebKit
- Take screenshots on failures
- Generate HTML reports

## Test Structure

```
apps/e2e/
├── package.json           # E2E package dependencies and scripts
├── playwright.config.ts   # Playwright configuration
├── tests/
│   ├── helpers.ts         # Reusable test utilities
│   └── scrum-poker-game.spec.ts  # Main test suite
└── README.md             # This file
```

## Helper Functions

The `helpers.ts` file provides reusable utilities:

- `ScrumPokerTestHelpers.createPlayer()` - Create new player session
- `ScrumPokerTestHelpers.loginPlayer()` - Log in a player
- `ScrumPokerTestHelpers.joinRoom()` - Join existing room
- `ScrumPokerTestHelpers.createRoom()` - Create new room
- `ScrumPokerTestHelpers.castVote()` - Cast a vote on a card
- `ScrumPokerTestHelpers.revealVotes()` - Reveal votes (room owner only)
- `ScrumPokerTestHelpers.clearVotes()` - Clear votes and start new round
- `ScrumPokerTestHelpers.leaveRoom()` - Leave current room
- `ScrumPokerTestHelpers.waitForParticipantCount()` - Wait for specific participant count
- `ScrumPokerTestHelpers.waitForVotingProgress()` - Wait for voting progress

## Debugging

If tests fail:

1. Check that both frontend and server are running properly
2. Look at the HTML report generated after test run
3. Use `pnpm test:debug` for step-by-step debugging
4. Screenshots are automatically taken on failures in `test-results/` directory
