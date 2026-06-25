import { chatRepository } from '../../domain/chat/chatRepository';
import { entiRepository } from '../../domain/enti/entiRepository';
import type { Group } from '../../domain/group/Group';
import type { Chat } from '../../domain/chat/Chat';
import type { Enti } from '../../domain/enti/Enti';
import { checkIsTauri } from '../../utils/isTauri';

export const syncChannel = new BroadcastChannel('entity_v2_sync');

if (checkIsTauri()) {
  import('@tauri-apps/api/event').then(({ emit, listen }) => {
    // Escuchar eventos de Tauri y retransmitirlos al BroadcastChannel local de esta ventana
    listen('entity_v2_sync_tauri', (event) => {
      syncChannel.postMessage(event.payload);
    });

    // Escuchar el BroadcastChannel local y retransmitirlo a Tauri (a otras ventanas)
    syncChannel.addEventListener('message', (e) => {
      // Evitar bucle infinito: si el mensaje viene con un flag, no lo retransmitimos
      if (e.data.__fromTauri) return;
      const payload = { ...e.data, __fromTauri: true };
      emit('entity_v2_sync_tauri', payload);
    });
  });
}

// Patch chatRepository save
const originalChatSave = chatRepository.save.bind(chatRepository);
chatRepository.save = (chat: Chat, fromSync = false) => {
  originalChatSave(chat);
  if (!fromSync) {
    syncChannel.postMessage({ type: 'chat_updated', chat: JSON.parse(JSON.stringify(chat)) });
  }
};

// Patch entiRepository save
const originalEntiSave = entiRepository.save.bind(entiRepository);
entiRepository.save = (enti: Enti, fromSync = false) => {
  originalEntiSave(enti);
  if (!fromSync) {
    syncChannel.postMessage({ type: 'enti_updated', enti: JSON.parse(JSON.stringify(enti)) });
  }
};

export function broadcastGroupsUpdate(grupos: Group[]) {
  syncChannel.postMessage({ type: 'grupos_updated', grupos: JSON.parse(JSON.stringify(grupos)) });
}
