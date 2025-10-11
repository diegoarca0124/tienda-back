import axios from 'axios';

export async function sendLogToLoki(
	level: 'log' | 'warn' | 'error',
	context: string,
	method: string,
	message: string,
	details: Record<string, any>,
	error?: string // opcional: 'success', 'failed', 'info'
) {
	try {
		const timestamp = `${Date.now()}000000`; // nanosegundos para Loki

		const body = {
			streams: [
				{
					stream: {
						service: context,
						level,
						method,
					},
					values: [[timestamp, JSON.stringify({ message, details, error })]],
				},
			],
		};

		await axios.post('http://localhost:3100/loki/api/v1/push', body, {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error: any) {
		console.error('❌ Error enviando log a Loki:', error.message || error);
	}
}
