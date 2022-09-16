import IAnalyticQuery from './IAnalyticQuery';
import IUser from './IUser';

export type SearchState = 'WAITING' | 'INDEXING' | 'PROCESSING' | 'ERROR' | 'DONE';

export default interface ISearch {
  id: number;
  user: IUser;
  state: SearchState;
  name: string;
  entries: number;
  indexed: number;
  toIndex: number;
  randomSeed: number | null;
  harvests: string[];
  filter: string;
  startedAt: string;
  updatedAt: string;
  finishedAt: string;
  createdAt: string;
  queries: IAnalyticQuery[];
  stopWords: string[];
  favorite: boolean;
}
