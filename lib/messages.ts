export type NoteSavedMessage = {
  type: 'NOTE_SAVED';
  urlKey: string;
  tabId: number;
};

export type NoteDeletedMessage = {
  type: 'NOTE_DELETED';
  urlKey: string;
  tabId: number;
};

export type ExtensionMessage = NoteSavedMessage | NoteDeletedMessage;

export function isNoteSavedMessage(message: unknown): message is NoteSavedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as NoteSavedMessage).type === 'NOTE_SAVED'
  );
}

export function isNoteDeletedMessage(message: unknown): message is NoteDeletedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as NoteDeletedMessage).type === 'NOTE_DELETED'
  );
}

