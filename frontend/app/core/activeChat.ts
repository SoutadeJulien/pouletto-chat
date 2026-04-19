/**
 * Module-level ref tracking the currently open chat.
 * Set by the chat screen on mount, cleared on unmount.
 * Used by useNotifications to suppress local notifications
 * when the user is already viewing that conversation.
 */
export const activeChat: {
  friendId: string | null;
  clearUnread: ((friendId: number) => void) | null;
} = { friendId: null, clearUnread: null };
