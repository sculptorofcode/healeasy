import { IRepository } from './base.repository';
import { User, IUser } from '../models/User';

type UserPlain = Omit<IUser, '_id'> & { _id?: string };

export class UserRepository implements IRepository<IUser> {
  async findById(id: string) {
    const doc = await User.findById(id).lean();
    return doc as IUser | null;
  }

  async findAll() {
    const docs = await User.find({}).lean();
    return docs as IUser[];
  }

  async findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async create(data: Partial<IUser>) {
    const user = new User({
      name: data.name,
      email: data.email?.toLowerCase(),
      passwordHash: data.passwordHash,
    });
    const saved = await user.save();
    return {
      _id: saved._id.toString(),
      name: saved.name,
      email: saved.email,
      passwordHash: saved.passwordHash,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    } as IUser;
  }

  async update(id: string, data: Partial<IUser>) {
    const doc = await User.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
    return doc as IUser | null;
  }

  async delete(id: string) {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }
}

export const userRepository = new UserRepository();
