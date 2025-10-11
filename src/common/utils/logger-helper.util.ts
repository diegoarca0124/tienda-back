import * as dotenv from 'dotenv';
import * as path from 'path';
import { sendLogToLoki } from './loki-logger.util';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });

export function logHelper(
	logger: any,
	level: 'log' | 'warn' | 'error',
	context: string,
	method: string,
	message: string,
	details: Record<string, any>,
	error?: string // opcional para colores en Grafana
) {
	if (process.env.DEBUGGER_LOGGER === 'true') {
		logger[level]({
			timestamp: new Date().toISOString(),
			context,
			method,
			message,
			details,
			error,
		});

		// Enviar a Loki
		sendLogToLoki(level, context, method, message, details, error);
	}
}
