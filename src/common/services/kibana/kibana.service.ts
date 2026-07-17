import { Injectable } from '@nestjs/common';
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

@Injectable()
export class KibanaService {
	private httpLogger: winston.Logger;
	private errorLogger: winston.Logger;
	private auditLogger: winston.Logger;
	private securityLogger: winston.Logger;

	constructor() {
		const elasticConfig = {
			clientOpts: {
				node: process.env.ELASTICSEARCH_NODE,
			},
		};

		// HTTP
		this.httpLogger = winston.createLogger({
			transports: [
				new ElasticsearchTransport({
					...elasticConfig,
					index: 'nestjs-http-logs',
				}),
			],
		});

		// ERROR LOGS
		this.errorLogger = winston.createLogger({
			transports: [
				new ElasticsearchTransport({
					...elasticConfig,
					index: 'nestjs-error-logs',
				}),
			],
		});

		// AUDIT LOGS
		this.auditLogger = winston.createLogger({
			transports: [
				new ElasticsearchTransport({
					...elasticConfig,
					index: 'nestjs-audit-logs',
				}),
			],
		});

		// SECURITY LOGS
		this.securityLogger = winston.createLogger({
			transports: [
				new ElasticsearchTransport({
					...elasticConfig,
					index: 'nestjs-security-logs',
				}),
			],
		});
	}

	// =====================================================
	// HTTP
	// =====================================================

	http(data: any) {
		this.httpLogger.info({
			...data,
		});
	}

	// =====================================================
	// ERROR
	// =====================================================
	error(data: any) {
		console.log(data);

		this.errorLogger.error({
			...data,
		});
	}

	// =====================================================
	// AUDIT
	// =====================================================

	audit(data: any) {
		this.auditLogger.info({
			...data,
		});
	}

	// =====================================================
	// SECURITY
	// =====================================================

	security(data: any) {
		this.securityLogger.warn({
			...data,
		});
	}
}
