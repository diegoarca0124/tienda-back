import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

@Injectable()
export class RedisTokenService {
	private client: Redis;

	async onModuleInit(): Promise<void> {
		this.client = new Redis({
			host: process.env.REDIS_HOST_TOKEN,
			port: Number(process.env.REDIS_PORT_TOKEN),
			password: process.env.REDIS_PASSWORD_TOKEN,
			connectTimeout: 1000, // Tiempo máximo de conexión: 1 segundo.
			maxRetriesPerRequest: 1, //Solo acepta un intento de conexion
			enableOfflineQueue: false, //No guarda request pendientes
			lazyConnect: true, // La conexión se inicia explícitamente y se espera abajo.
		});

		try {
			await this.client.connect();
		} catch (error) {
			this.client.disconnect();
			throw error;
		}
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

	async addToSet(key: string, value: string, ttlSeconds: number) {
		const transaction = this.client.multi();
		transaction.sadd(key, value);
		transaction.expire(key, ttlSeconds);
		await transaction.exec();
	}

	async getSetMembers(key: string): Promise<string[]> {
		return this.client.smembers(key);
	}

	async del(key: string) {
		return this.client.del(key);
	}

	async onModuleDestroy() {
		if (this.client?.status === 'ready') {
			await this.client.quit();
		} else {
			this.client?.disconnect();
		}
	}
}
