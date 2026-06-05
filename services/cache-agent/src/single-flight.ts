export class SingleFlight<T> {
  private activeRequests = new Map<string, Promise<T>>();

  async do(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key)!;
    }

    const promise = fn().finally(() => {
      this.activeRequests.delete(key);
    });

    this.activeRequests.set(key, promise);
    return promise;
  }
}
