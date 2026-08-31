export type NoteSavedMessage = {
  type: 'NOTE_SAVED';
  urlKey: string;
  tabId: number;
};

export type ExtensionMessage = NoteSavedMessage;

export function isNoteSavedMessage(message: unknown): message is NoteSavedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as NoteSavedMessage).type === 'NOTE_SAVED'
  );
}
