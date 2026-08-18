type Handler = () => void;
let handler: Handler | null = null;
let firing = false;

export function setUnauthorizedHandler(fn: Handler | null) {
  handler = fn;
  firing = false;
}

export function triggerUnauthorized() {
  if (!handler || firing) return;
  firing = true;
  handler();
  setTimeout(() => {
    firing = false;
  }, 2000);
}
