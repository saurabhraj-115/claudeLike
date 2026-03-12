// Module-level set of conversation IDs that should animate their title
// when they first appear in the sidebar. Consumed (deleted) on first render.
const pendingAnimations = new Set<number>();

export function markConversationNew(id: number) {
  pendingAnimations.add(id);
}

/** Returns true (and removes the ID) if this conversation should animate its title. */
export function consumeNewConversation(id: number): boolean {
  if (pendingAnimations.has(id)) {
    pendingAnimations.delete(id);
    return true;
  }
  return false;
}
