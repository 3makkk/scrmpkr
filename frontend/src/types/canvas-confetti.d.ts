declare module "canvas-confetti" {
  // We only call confetti() with no options; keep options generic and safe
  const confetti: (options?: unknown) => void;
  export default confetti;
}
