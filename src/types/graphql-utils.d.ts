import * as Redis from 'ioredis';
import { Request } from 'express';

export interface Session extends Express.Session {
  userId?: string;
}

export interface Context {
  redis: Redis.Redis;
  url: string;
  session: Session;
  request: Express.Request;
}

export type Resolver = (
  parent: any,
  args: any,
  context: Context,
  info: any,
) => any;

export type Middleware = (
  resolver: Resolver,
  parent: any,
  args: any,
  context: Context,
  info: any,
) => any;

export interface ResolverMap {
  [key: string]: {
    [key: string]: Resolver;
  };
}
