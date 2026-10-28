export type User = {
  id: string;
  name: string;
};

export const FIB_DECK: Array<number | "?"> = [
  0,
  1,
  2,
  3,
  5,
  8,
  13,
  21,
  34,
  55,
  "?",
];

export const isVoteValue = (value: unknown): value is number | "?" =>
  FIB_DECK.includes(value as number | "?");
