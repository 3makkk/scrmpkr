# Visual system: one clean, consistent design

## Intent

The frontend has grown several design approaches side by side. Colour carries
too many meanings (blue is the primary button, the Participant role, a revealed
vote, the selected card, the result bars and every focus ring), primary and
secondary actions look almost the same, and every component invents its own
hover, focus and selected states. The goal is a clean, consistent design: one
accent colour used on purpose, a clear hierarchy of actions, and the same state
looking the same everywhere.

This builds on the layout work already on branch `feat/modern-layout`
(uncommitted at the time of writing), which this project absorbs:

- Room page: header and team sidebar sit directly on the page background as one
  frame; the voting area (deck, results, observer notice) is one raised, rounded
  card. On desktop the page fits the viewport and the card scrolls internally;
  on small screens the sidebar stacks above the card.
- The sticky footer is replaced by one floating, pill-shaped button centred at
  the bottom of the card (bottom-centre of the viewport on small screens):
  "Reveal votes" with an `N/M` voted badge, then "Start Next Round" after reveal.
  It is shown to everyone allowed to control the Round (Participants and
  Facilitators, per the RBAC `session:control` permission), never to Visitors.
- Every page has a near-black background with a faint blue/violet/sky gradient
  mesh and a fine grain (`bg-mesh` utility in `index.css`).
- Deck and results no longer draw their own bordered box inside the main card.

## Goals

1. **One accent colour.** Blue, and only for: primary actions, the selected
   state, the focus ring, links, and the vote bars in the results chart (the
   one data use, approved explicitly).
2. **Clear action hierarchy** using that one colour (approved option "A: Solid ·
   Outline · Text"):
   - **Primary** — solid blue fill, white text. At most one per view.
     Create custom room, Join room, Enter, Create room (submit), Reveal votes,
     Start next round.
   - **Secondary** — transparent, thin grey outline, light text; hover lightens
     the surface and the outline. Leave room, Create random room.
   - **Tertiary** — plain grey text, turns white on hover, no fill or border.
     Cancel buttons, account menu items.
   - **Danger** — the secondary style in red. Kept for destructive actions;
     nothing needs it today.
3. **One meaning per colour** (approved option "B: Blue + green for done"):
   - Blue: primary, selected, focus, links, result bars.
   - Muted green: "done / good" only — voted, consensus yes.
   - Red: errors and "no consensus" only.
   - Everything else is grey. Roles carry no colour.
4. **Same state, same look, everywhere:**
   - **Selected** — blue border plus a faint blue wash. Applies to the chosen
     poker card and the chosen role in role selection. ("You" in the
     participant list is not a selection; see the participant list below.)
   - **Hover** — a slight lightening of the surface or outline. No scaling, no
     added shadows. Exception: poker cards keep a small lift on hover.
   - **Focus** — one blue ring, keyboard-only (`focus-visible`), same width and
     offset everywhere. Every interactive element has it, including menu items.
   - **Disabled** — 50% opacity, not-allowed cursor (as today).
   - **Status** — voted: green check icon + "voted"; thinking: grey clock icon
     + "thinking"; Facilitator and Visitor: grey line icons, no colour.
5. **Line icons instead of emoji** for roles (🗳️ 🎬 👁 today) and status.
6. **A design principles document** is a deliverable of this project, so the
   system stays consistent after it ships. See "Design principles document"
   below.

## Design principles document

Requested by the user as an outcome of this project.

- **Purpose:** the single reference for how the UI looks and behaves, so any
  future change — by a person or a coding agent — lands consistent without
  re-deriving these decisions.
- **Audience (confirmed):** the maintainer and coding agents working in this
  repo — not external designers or contributors. Write it to be scanned and
  applied: rules and tokens up front, short reasons, concrete examples from
  this app.
- **Location:** `docs/DESIGN_PRINCIPLES.md`, next to `docs/ACL_DOCUMENTATION.md`.
  Linked from the "Other docs" list in `CLAUDE.md` and from `AGENTS.md`'s
  UI section. The DS README links to it for the rules and keeps only the
  per-component reference (props, usage), following the repo rule "keep each
  fact in one place". *(my call)*
- **Content** — principles first, then the rules that follow from them:
  - A short list of principles with the why, e.g. "One accent, used on
    purpose", "Hierarchy before decoration", "Same state, same look",
    "Never colour alone", "Quiet surfaces, content in front".
  - Colour roles and what each may and may not be used for, with the token
    names.
  - Action hierarchy (primary / secondary / tertiary / danger), when to use
    each, and the one-primary-per-view rule.
  - States (hover, focus, selected, disabled, status) and how each looks.
  - Surfaces and layout (page frame, raised card, inset; the room layout
    pattern and the floating action).
  - Radii, type scale, icons, motion (what animates and what doesn't).
  - Accessibility rules (contrast, keyboard focus, no colour-only status).
  - A short do / don't list drawn from this audit (e.g. no per-component
    hover effects, no raw palette classes, no emoji icons).
- **Written last**, from what was actually built, so it describes the shipped
  tokens and components rather than the plan.

## Decided details

These came out of the conversation and the approved mockups (kept under
`.superpowers/brainstorm/`, git-ignored: `buttons.html`, `states.html`,
`card-face.html`, `layout-v2.html`). The playback the user approved also
covered: one grey family with three surface levels, hover as a slight
lightening, three corner radii, one medium heading weight on a fixed scale,
and no shadows or hover/press scaling on buttons.

- Starting values from the approved mockups (Tailwind palette):
  primary `blue-600`, hover `blue-700`; selected border `blue-500` with a
  `blue-500` wash at roughly 12–15% opacity; focus ring `blue-400`;
  done `green-400`; error/no-consensus `red-400`; neutrals from the `gray`
  family only.
- **Poker cards keep today's playing-card face** (approved option "A" in
  `card-face.html`): gradient body, inner frame, small value in two corners,
  corner ornaments, big faded value in the middle — recoloured to greys. The
  eight per-value colours (slate, indigo, cyan, emerald, amber, violet, rose,
  teal) go. Hover: a small lift (about 4px), no scaling. Selected: the shared
  selected treatment (blue border, faint blue wash over the face), the big
  centre value turns solid white, and the card stays raised (about 8px), no
  scaling and no glow.
- Result bars become blue; the "?" bar becomes grey instead of purple. The
  vote-value labels beside the bars become light grey/white, not blue.
- User avatars lose role colours (today blue/amber/purple); all avatars use one
  neutral style.
- Role option cards (role selection form and in-room role change) lose their
  per-role border/tint/hover colours and use the shared selected/hover states.
- The error screen's raw "Return Home" `<button>` moves onto the shared
  `Button`.

- **Participant list** follows the structure in `states.html` (option B):
  - Flat rows on the sidebar background; the bordered box per row goes. Each
    row: neutral avatar (initials), name, status on the right.
  - Status: Participants show a green check + "voted" or a grey clock +
    "thinking". Facilitators and Visitors show their grey line icon plus the
    existing text ("managing", "observing") — the text stays because copy is
    out of scope.
  - After reveal, a Participant's row shows their vote value as a small
    neutral chip instead of today's blue dot; no vote shows "—".
  - Group headings keep today's wording and counts ("Active Participants
    (2/3)", etc.), styled as the uppercase small label.

## My calls (not discussed — check these)

- **"You" in the participant list gets a grey row wash, not blue.** The
  playback said "selected look", but the approved mockups show a grey wash,
  and blue on a row that is not a selection would break goal 1.
- **Tokens: semantic, but the Tailwind palette stays.** Every colour role gets
  a theme variable in `@theme` in `index.css`: accent (+ hover), success,
  danger, three surfaces (page, raised, inset), border (default, strong), and
  three text levels (primary, muted, subtle); plus the three radii.
  Components use these utilities (`bg-accent`, `text-muted`, `rounded-control`
  or similar) instead of raw palette classes everywhere, including text greys.
  The default Tailwind palette is not reset (so `bg-mesh` and Storybook keep
  working); the token utilities are the convention, documented in the DS
  README. This keeps the DS rule "inline Tailwind utilities only, no
  component CSS classes, no `@apply`".
- **Surfaces.** `gray` only; the `slate` uses go. Page (the `bg-mesh`
  background), raised (cards, menus, modals), inset (areas inside a card such
  as the bar track and hovered list rows).
- **Radii.** Small for badges; medium for buttons, inputs, list rows, role
  options, poker cards; large for cards, menus and modals. The floating
  Reveal button and avatars stay fully round.
- **Type scale.** Medium weight for headings. Page title (login, join, home),
  section title (results, modals, room title), uppercase small label (sidebar
  group headings, stat labels). `font-light`, bold, extrabold and black go,
  except the large vote numbers in the results and the poker card values,
  which may stay bold.
- **Icons.** A small set of inline SVG icon components in the DS (check, clock,
  flag for Facilitator, eye for Visitor, ballot/card for Participant, alert for
  errors). No new icon dependency.
- **The floating Reveal button keeps a shadow** because it floats over
  content; all other buttons have none.
- **Smaller recolours:** the loading spinner and the "Welcome back, <name>"
  highlight on Home turn neutral (white/grey), not blue. In the change-role
  dialog the current role uses the selected look at full opacity (it is the
  selection, even though it cannot be clicked).
- **Entrance animations** (`animate-fade-in-*`, `slide-in`, etc.) stay as they
  are; this project only removes hover/press scaling from buttons. The
  "everyone voted" glow pulse on the Reveal button stays.

## Non-goals

- No light theme.
- No change to the order or structure of pages beyond what the layout work
  above already did.
- No new features, copy rewrites or behaviour changes. (The facilitator's main
  card says "You're viewing this session as a visitor" — a known copy issue,
  out of scope.)
- No change to who can see or use which control.

## Anti-goals (would make this a failure even if it technically works)

- Blue showing up for anything that is not an action, a selection, focus or a
  link.
- Primary and secondary actions that still need a second look to tell apart.
- New one-off colours, radii or hover effects introduced inside a component
  instead of using the shared tokens.
- Losing the readable at-a-glance status of the participant list (who voted,
  who is still thinking, who is facilitating or watching).

## Constraints

- Follow `AGENTS.md`: DS components keep `UIProps<Tag, Extra>` pass-through,
  `className` merging, composition over config. Biome lint/format, including
  `useSortedClasses`. No `tailwind-merge` in the project; class conflicts with
  passed `className` are resolved today with the `!` important suffix.
- Keep every existing `data-testid`; the Playwright suite in `apps/e2e` relies
  on them (`reveal-votes-button`, `clear-votes-button`, `voting-progress`,
  `vote-card-<value>`, `participant-<name>`, role option ids, etc.).
  `voting-progress` now holds the `N/M` badge and the e2e assertion was
  already updated to match.
- Accessibility: status must not rely on colour alone (icons + text), focus
  must stay visible on every interactive element, text contrast must meet WCAG
  AA on the dark surfaces.
- DS components have Storybook stories; they must be updated to show the new
  variants and states.
- `apps/frontend/src/components/ds/README.md` describes the current hover
  scaling and role-coloured avatars; it must be updated to the new rules.

## Left to the builder

- Exact token names and final shade/opacity values, as long as they keep the
  colour roles above and stay close to the approved mockups.
- How to structure the icon components and the Button variant API (for example
  `variant: "primary" | "secondary" | "tertiary" | "danger"`).
- Whether `Badge`'s `rounded` prop survives (it is unused outside the DS) or
  collapses to the shared radius.
- Whether the unused `Motion.tsx` interaction bundles (`buttonHover`,
  `scaleOnHover`, …) are removed or updated.
- Order of work. A sensible sequence: tokens → Button → states (selected,
  hover, focus) in the DS → domain components → pages → stories → design
  principles document and doc links.

## Affected areas (from the audit)

- Tokens: `apps/frontend/src/index.css`.
- DS: `Button`, `Input`, `Card`, `Dropdown`, `Modal`, `Badge`, `PokerCard`,
  `UserAvatar`, `BarVoteChart`, `Motion`, plus their stories and the DS README.
- Docs: new `docs/DESIGN_PRINCIPLES.md`; links from `CLAUDE.md` and `AGENTS.md`;
  DS README trimmed to component reference.
- Auth: `LoginForm`, `UsernameForm`, `RoleSelectionForm`, `RoleOptionCard`,
  `roleOptions.ts`, `AccountIndicator`, `UserInfoSection`.
- Room: `RoomContextBar`, `ContextualTeamStatus`, `StateAwareSessionControls`.
- Poker: `VotingDeck`, `VotingResults`, `PrimaryActionZone`.
- Core: `LoadingSpinner`, `PageLayout`.
- Pages: `Home`, `Room` (including the error and loading states).
- Storybook preview background (`apps/frontend/.storybook/preview.css`, currently a
  hard-coded slate colour) should match the page surface.
