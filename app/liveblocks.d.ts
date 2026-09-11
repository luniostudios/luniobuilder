import type { JsonObject } from '@liveblocks/client';

declare global {
  interface Liveblocks {
    Presence: {
      selectedElementId: string | null;
    };
    Storage: {
      document: string;
    };
    UserMeta: {
      info: {
        name: string;
        avatar?: string;
      };
    };
    RoomEvent: JsonObject;
  }
}

export {};
