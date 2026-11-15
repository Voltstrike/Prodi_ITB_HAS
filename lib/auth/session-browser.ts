import { SESSION_ACTIVITY_INTERVAL_MS, SESSION_WARNING_MS } from "./session-policy";

export type BrowserSession = {
    sessionId: number;
    serverNow: number;
    absoluteExpiresAt: number;
    idleExpiresAt: number;
    expiresAt: number;
};

export type SessionView = {
    seconds: number | null;
    absolute: boolean;
    busy: boolean;
    unavailable: boolean;
    changed: boolean;
};

function validState(value: unknown): value is BrowserSession {
    if (!value || typeof value !== "object") return false;
    const item = value as BrowserSession;
    return Number.isSafeInteger(item.sessionId) && item.sessionId > 0 &&
        [item.serverNow, item.absoluteExpiresAt, item.idleExpiresAt, item.expiresAt]
            .every((time) => typeof time === "number" && Number.isFinite(time)) &&
        item.expiresAt === Math.min(item.absoluteExpiresAt, item.idleExpiresAt) &&
        item.expiresAt > item.serverNow;
}

type Options = {
    now: () => number;
    request: (sessionId?: number) => Promise<Response>;
    render: (view: SessionView) => void;
    expired: () => void;
    changed: () => void;
};

// Tidak memiliki heartbeat aktivitas. POST hanya berasal dari activity().
export class SessionBrowser {
    private receivedAt: number;
    private clockAt: number;
    private busy = false;
    private stopped = false;
    private confirmed = false;
    private unavailable = false;
    private changed = false;
    private pending = false;
    private activityAt = -Infinity;
    private checkedAt = -Infinity;
    private touchedAt = -Infinity;

    constructor(private state: BrowserSession, private options: Options) {
        if (!validState(state)) throw new Error("Status sesi awal tidak valid.");
        this.receivedAt = options.now();
        this.clockAt = this.receivedAt;
    }

    private remaining() {
        const elapsed = Math.max(0, this.options.now() - this.receivedAt);
        return this.state.expiresAt - this.state.serverNow - elapsed;
    }

    private render() {
        if (this.stopped) return;
        const remaining = this.remaining();
        this.options.render({
            seconds: remaining <= SESSION_WARNING_MS
                ? Math.max(0, Math.ceil(remaining / 1000)) : null,
            absolute: this.state.absoluteExpiresAt <= this.state.idleExpiresAt,
            busy: this.busy,
            unavailable: this.unavailable,
            changed: this.changed,
        });
    }

    dispose() { this.stopped = true; }

    check() {
        // Focus/online/pageshow tidak dihitung sebagai aktivitas.
        this.confirmed = false;
        if (!this.busy) void this.send(false);
    }

    activity() {
        if (this.stopped || this.changed) return;
        this.activityAt = this.options.now();
        this.pending = true;
        this.tick();
    }

    tick() {
        if (this.stopped || this.changed) return;
        const now = this.options.now();
        if (now < this.clockAt) {
            this.pending = false;
            this.confirmed = false;
            this.checkedAt = -Infinity;
            this.touchedAt = -Infinity;
        }
        this.clockAt = now;
        // Jangan mengirim aktivitas tertunda yang sudah lama setelah sleep.
        if (now - this.activityAt > SESSION_ACTIVITY_INTERVAL_MS) this.pending = false;
        this.render();
        if (this.busy) return;

        const remaining = this.remaining();
        const interval = remaining <= 0 || this.unavailable ? 5000 : SESSION_ACTIVITY_INTERVAL_MS;
        if (!this.confirmed || now - this.checkedAt >= interval) {
            if (now - this.checkedAt >= interval) void this.send(false);
            return;
        }
        if (remaining > 0 && this.pending && now - this.touchedAt >= SESSION_ACTIVITY_INTERVAL_MS) {
            void this.send(true);
        }
    }

    private async send(activity: boolean) {
        if (this.stopped || this.busy || this.changed) return;
        this.busy = true;
        if (activity) {
            this.pending = false;
            this.touchedAt = this.options.now();
        } else {
            this.checkedAt = this.options.now();
        }
        this.render();

        try {
            const response = await this.options.request(activity ? this.state.sessionId : undefined);
            if (this.stopped) return;
            if (response.status === 401) {
                this.confirmed = false;
                this.pending = false;
                if (activity) {
                    // Periksa cookie terbaru; tab lain mungkin baru login.
                    this.checkedAt = -Infinity;
                } else {
                    this.stopped = true;
                    this.options.expired();
                }
                return;
            }
            if (response.status === 409) {
                this.sessionChanged();
                return;
            }
            if (!response.ok) throw new Error("Status sesi tidak tersedia.");
            const next: unknown = await response.json();
            if (this.stopped) return;
            if (!validState(next)) throw new Error("Respons sesi tidak valid.");
            if (next.sessionId !== this.state.sessionId) {
                this.sessionChanged();
                return;
            }
            this.state = next;
            this.receivedAt = this.options.now();
            this.confirmed = true;
            this.unavailable = false;
        } catch {
            if (!this.stopped) {
                this.unavailable = true;
                this.confirmed = false;
                this.pending = false;
            }
        } finally {
            this.busy = false;
            this.render();
        }
    }

    private sessionChanged() {
        this.changed = true;
        this.pending = false;
        this.options.changed();
    }
}
