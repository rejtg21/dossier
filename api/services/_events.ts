export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

/** The event names, and the shape each one carries. */
export interface EventPayloads {
  "email-failed": {
    messageId: string;
    deliveryCount: number;
    error: string;
    submission: ContactSubmission;
  };
  "email-sent": { messageId: string };
}

export type EventName = keyof EventPayloads;

type Listener<E extends EventName> = (
  payload: EventPayloads[E],
) => void | Promise<void>;

/**
 * A deliberately small async event bus.
 *
 * Node's EventEmitter is not usable here: it fires listeners without awaiting
 * them, so the function could return — and the queue message be acknowledged —
 * before a listener finished writing to storage. `emit` awaits every listener,
 * which is the whole point.
 *
 * In-process only. It exists to separate "the email failed" from "what we do
 * about it", not to cross a network boundary; the queue already does that.
 */
const listeners = new Map<EventName, Set<Listener<EventName>>>();

export function on<E extends EventName>(event: E, listener: Listener<E>): void {
  const existing = listeners.get(event) ?? new Set();
  existing.add(listener as Listener<EventName>);
  listeners.set(event, existing);
}

/**
 * Resolves once every listener has settled. Rejects with the first listener
 * error, but only after all of them have run — one failing listener must not
 * prevent the others from doing their work.
 */
export async function emit<E extends EventName>(
  event: E,
  payload: EventPayloads[E],
): Promise<void> {
  const registered = listeners.get(event);
  if (!registered) return;

  const results = await Promise.allSettled(
    [...registered].map((listener) => listener(payload)),
  );

  const failure = results.find((r) => r.status === "rejected");
  if (failure) throw failure.reason;
}

/** Test seam: listeners are module state and would leak between cases. */
export function resetListeners(): void {
  listeners.clear();
}
