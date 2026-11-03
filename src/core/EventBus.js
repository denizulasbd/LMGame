// Sistemlerin birbirini doğrudan tanımadan haberleşmesini sağlar.
// Örn: TimeSystem 'time:newDay' yayınlar, NeedsSystem dinler.
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Yayın sırasında eklenen dinleyiciler bu yayını almaz (örn. sahne yeniden kurulurken yeni
   * sistemlerin aynı olayı yeniden işlemesi), çıkarılanlar da çağrılmaz.
   */
  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of [...handlers]) {
      if (handlers.has(handler)) handler(payload);
    }
  }
}
