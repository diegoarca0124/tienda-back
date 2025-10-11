import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { InternalServerErrorException } from '@nestjs/common';

dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`) });
/* const sslOptions =
  process.env.DB_SSL === 'true'
    ? {
        ca: fs.readFileSync(path.join(__dirname, '..', 'certs', 'rds-combined-ca-bundle.pem')).toString(),
        rejectUnauthorized: true,
      }
    : false; 
*/

export const AppDataSource = new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST,
	port: 5432,
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	entities: [__dirname + '/entities/*.entity{.ts,.js}'],
	synchronize: false,
	migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
	ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
