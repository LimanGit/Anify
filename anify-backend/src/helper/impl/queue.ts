type EventsMap = {
    end: { error?: Error };
    error: { error: Error; job: QueueWorker };
    timeout: { next: (err?: Error, ...result: any[]) => void; job: QueueWorker };
    success: { result: any[] };
    start: { job?: QueueWorker };
};

export interface Options {
    /**
     * Max number of jobs the queue should process concurrently.
     *
     * @default Infinity
     */
    concurrency?: number;

    /**
     * Milliseconds to wait for a job to execute its callback.
     *
     * @default 0
     */
    timeout?: number;

    /**
     * Ensures the queue is always running if jobs are available.
     *
     * @default false
     */
    autostart?: boolean;

    /**
     * An array to set job callback arguments on.
     *
     * @default null
     */
    results?: any[];
}

export interface QueueWorker {
    (callback?: QueueWorkerCallback): void | Promise<any>;

    /**
     * Override queue timeout.
     */
    timeout?: number;
    /**
     *  If the QueueWorker returns a promise, it will be moved to this field.
     *  This can be useful when tracking timeout events
     */
    promise?: Promise<any>;
}

export interface QueueWorkerCallback {
    (error?: Error, data?: object): void;
}

/**
 * Since CustomEvent is only supported in nodejs since version 19,
 * you have to create your own class instead of using CustomEvent
 * @see https://github.com/nodejs/node/issues/40678
 * */
export class QueueEvent<Name extends keyof EventsMap, Detail extends EventsMap[Name]> extends Event {
    readonly detail: Detail;

    constructor(name: Name, detail: Detail) {
        super(name);
        this.detail = detail;
    }
}

export default class Queue extends EventTarget {
    public concurrency: number;
    private timeout: number;
    private autostart: boolean;
    private results: any[] | null;
    private pending: number;
    private session: number;
    private running: boolean;
    private jobs: QueueWorker[];
    private timers: number[];

    constructor(options: Options = {}) {
        super();
        const { concurrency = Infinity, timeout = 0, autostart = false, results = null } = options;
        this.concurrency = concurrency;
        this.timeout = timeout;
        this.autostart = autostart;
        this.results = results;
        this.pending = 0;
        this.session = 0;
        this.running = false;
        this.jobs = [];
        this.timers = [];
        this.addEventListener("error", ((evt: Event) => {
            if (evt instanceof QueueEvent) {
                this.end(evt.detail.error);
            }
        }) as EventListener);
    }

    pop(): QueueWorker | undefined {
        return this.jobs.pop();
    }

    shift(): QueueWorker | undefined {
        return this.jobs.shift();
    }

    indexOf(searchElement: QueueWorker, fromIndex?: number): number {
        return this.jobs.indexOf(searchElement, fromIndex);
    }

    lastIndexOf(searchElement: QueueWorker, fromIndex?: number): number {
        if (fromIndex !== undefined) return this.jobs.lastIndexOf(searchElement, fromIndex);
        return this.jobs.lastIndexOf(searchElement);
    }

    slice(start?: number, end?: number): Queue {
        this.jobs = this.jobs.slice(start, end);
        return this;
    }

    reverse(): Queue {
        this.jobs.reverse();
        return this;
    }

    push(...workers: QueueWorker[]): number {
        const methodResult = this.jobs.push(...workers);
        if (this.autostart) this._start();
        return methodResult;
    }

    unshift(...workers: QueueWorker[]): number {
        const methodResult = this.jobs.unshift(...workers);
        if (this.autostart) this._start();
        return methodResult;
    }

    splice(start: number, deleteCount?: number, ...workers: QueueWorker[]): Queue {
        this.jobs.splice(start, deleteCount || 0, ...workers);
        if (this.autostart) this._start();
        return this;
    }

    get length(): number {
        return this.pending + this.jobs.length;
    }

    start(callback?: (error?: Error, results?: any[] | null) => void): Promise<any[] | null> | void {
        if (this.running) throw new Error("already started");
        let awaiter: Promise<any[] | null> | undefined;
        if (callback) {
            this._addCallbackToEndEvent(callback);
        } else {
            awaiter = this._createPromiseToEndEvent();
        }
        this._start();
        return awaiter;
    }

    private _start(): void {
        this.running = true;
        if (this.pending >= this.concurrency) {
            return;
        }
        if (this.jobs.length === 0) {
            if (this.pending === 0) {
                this.done(undefined);
            }
            return;
        }
        const job = this.jobs.shift();
        if (!job) return;

        const session = this.session;
        const timeout = job.timeout !== undefined ? job.timeout : this.timeout;
        let once = true;
        let timeoutId: number | null = null;
        let didTimeout = false;
        let resultIndex: number | null = null;

        const next = (error?: Error, ...result: any[]): void => {
            if (once && this.session === session) {
                once = false;
                this.pending--;
                if (timeoutId !== null) {
                    this.timers = this.timers.filter((tID) => tID !== timeoutId);
                    clearTimeout(timeoutId);
                }
                if (error) {
                    this.dispatchEvent(new QueueEvent("error", { error, job }));
                } else if (!didTimeout) {
                    if (resultIndex !== null && this.results !== null) {
                        this.results[resultIndex] = [...result];
                    }
                    this.dispatchEvent(new QueueEvent("success", { result: [...result], job }));
                }
                if (this.session === session) {
                    if (this.pending === 0 && this.jobs.length === 0) {
                        this.done(undefined);
                    } else if (this.running) {
                        this._start();
                    }
                }
            }
        };

        if (timeout) {
            timeoutId = setTimeout(() => {
                didTimeout = true;
                this.dispatchEvent(new QueueEvent("timeout", { next, job }));
                next(undefined);
            }, timeout) as unknown as number;
            this.timers.push(timeoutId);
        }

        if (this.results != null) {
            resultIndex = this.results.length;
            this.results[resultIndex] = null;
        }

        this.pending++;
        this.dispatchEvent(new QueueEvent("start", { job }));
        const promise = job(next);
        if (promise && typeof promise.then === "function") {
            job.promise = promise;
            promise
                .then((result: any) => {
                    return next(undefined, result);
                })
                .catch((err: Error) => {
                    return next(err || new Error("Unknown error"));
                });
        }

        if (this.running && this.jobs.length > 0) {
            this._start();
        }
    }

    stop(): void {
        this.running = false;
    }

    end(error?: Error): void {
        this.clearTimers();
        this.jobs.length = 0;
        this.pending = 0;
        this.done(error);
    }

    private clearTimers(): void {
        this.timers.forEach((timer) => {
            clearTimeout(timer);
        });
        this.timers = [];
    }

    private _addCallbackToEndEvent(cb: (error?: Error, results?: any[] | null) => void): void {
        const onend = ((evt: Event) => {
            if (evt instanceof QueueEvent) {
                this.removeEventListener("end", onend);
                cb(evt.detail.error, this.results);
            }
        }) as EventListener;
        this.addEventListener("end", onend);
    }

    private _createPromiseToEndEvent(): Promise<any[] | null> {
        return new Promise((resolve, reject) => {
            this._addCallbackToEndEvent((error, results) => {
                if (error) reject(error);
                else resolve(results ?? null);
            });
        });
    }

    private done(error?: Error): void {
        this.session++;
        this.running = false;
        this.dispatchEvent(new QueueEvent("end", { error }));
    }
}
