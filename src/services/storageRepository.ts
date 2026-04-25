export class LocalStorageRepository<T> {
  constructor(private readonly storageKey: string) {}

  read(): T | null {
    try {
      const rawValue = window.localStorage.getItem(this.storageKey);
      return rawValue ? (JSON.parse(rawValue) as T) : null;
    } catch (error) {
      console.warn(`Unable to read ${this.storageKey} from local storage`, error);
      return null;
    }
  }

  write(value: T): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Unable to write ${this.storageKey} to local storage`, error);
    }
  }

  remove(): void {
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn(`Unable to remove ${this.storageKey} from local storage`, error);
    }
  }
}
