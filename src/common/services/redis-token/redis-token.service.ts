import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class RedisTokenService {
	private client: Redis;

	onModuleInit() {
		this.client = new Redis({
			host: process.env.REDIS_HOST_TOKEN,
			port: Number(process.env.REDIS_PORT_TOKEN),
			password: process.env.REDIS_PASSWORD_TOKEN,
		});
	}

	async set(key: string, value: string, ttlSeconds?: number) {
		if (ttlSeconds) {
			await this.client.set(key, value, 'EX', ttlSeconds); // expira automáticamente
		} else {
			await this.client.set(key, value);
		}
	}

	async get(key: string): Promise<string | null> {
		return this.client.get(key);
	}

	async del(key: string) {
		return this.client.del(key);
	}

	async onModuleDestroy() {
		await this.client.quit();
	}
}
