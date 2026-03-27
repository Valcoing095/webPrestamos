export class BaseModel {
  id: string;
  createdAt: string;

  constructor(data: Partial<BaseModel> = {}) {
    this.id = data.id || this.generateId();
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  protected generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  toJSON(): any {
    return { ...this };
  }
}
