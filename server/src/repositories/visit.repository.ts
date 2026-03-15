import { Visit, IVisit } from '../models/Visit';

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export class VisitRepository implements IRepository<IVisit> {
  async findById(id: string): Promise<IVisit | null> {
    return Visit.findById(id).lean();
  }

  async findAll(filter: Partial<IVisit> = {}): Promise<IVisit[]> {
    return Visit.find(filter).sort({ visitDateTime: -1 }).lean();
  }

  async findByUserId(userId: string): Promise<IVisit[]> {
    return Visit.find({ userId }).sort({ visitDateTime: -1 }).lean();
  }

  async create(data: Partial<IVisit>): Promise<IVisit> {
    const visit = new Visit(data);
    return visit.save();
  }

  async update(id: string, data: Partial<IVisit>): Promise<IVisit | null> {
    return Visit.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
  }

  async delete(id: string): Promise<boolean> {
    const result = await Visit.findByIdAndDelete(id);
    return result !== null;
  }

  async updateAiSummary(id: string, summary: IVisit['aiSummary']): Promise<IVisit | null> {
    return Visit.findByIdAndUpdate(id, { aiSummary: summary }, { returnDocument: 'after' }).lean();
  }
}

export const visitRepository = new VisitRepository();
