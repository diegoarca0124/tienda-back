import { mkdtemp, open, rm } from 'node:fs/promises';
import { createWriteStream, WriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stream } from 'exceljs';
import { ExportCollaboratorsRes } from '../interface/controller.interface';

/** Escribe cada lote en disco sin conservar todos los registros en memoria. */
export async function exportCollaboratorsFile(
	fields: string[],
	format: 'xlsx' | 'csv',
	rows: AsyncIterable<unknown[]>
): Promise<ExportCollaboratorsRes> {
	const directory = await mkdtemp(join(tmpdir(), 'collaborators-export-'));
	const fileName = `EXP-COLLABORATORS-${Date.now()}.${format}`;
	const filePath = join(directory, fileName);
	const cleanup = () => rm(directory, { recursive: true, force: true });
	let csvFile: Awaited<ReturnType<typeof open>> | undefined;
	let workbook: stream.xlsx.WorkbookWriter | undefined;
	let output: WriteStream | undefined;
	let outputFinished: Promise<void> | undefined;
	let outputError: unknown;
	try {
		if (format === 'csv') {
			csvFile = await open(filePath, 'wx');
			await csvFile.writeFile('\uFEFF' + fields.map((field) => field.toUpperCase()).join(',') + '\n');
			let buffer = '';
			for await (const values of rows) {
				const line = values.map((value) => {
					let text = String(value ?? '');
					if (/^(?:[\t\r\n]|\s*[=+\-@])/.test(text)) text = `'${text}`;
					return `"${text.replace(/"/g, '""')}"`;
				}).join(',');
				buffer += line + '\n';
				if (buffer.length >= 64 * 1024) {
					await csvFile.writeFile(buffer);
					buffer = '';
				}
			}
			if (buffer) await csvFile.writeFile(buffer);
			await csvFile.close();
			csvFile = undefined;
		} else {
			output = createWriteStream(filePath, { flags: 'wx' });
			outputFinished = finished(output).catch((error) => { outputError = error; });
			workbook = new stream.xlsx.WorkbookWriter({ stream: output, useSharedStrings: false, useStyles: false });
			let sheetNumber = 0;
			const createSheet = () => {
				const sheet = workbook!.addWorksheet(++sheetNumber === 1 ? 'COLLABORATORS' : `COLLABORATORS_${sheetNumber}`);
				sheet.columns = fields.map((field) => ({ key: field, width: Math.min(Math.max(field.length + 2, 28), 60) }));
				sheet.addRow(fields).commit();
				return sheet;
			};
			let sheet = createSheet();
			let sheetRows = 1;
			const finishSheet = () => {
				sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheetRows, column: fields.length } };
				sheet.commit();
			};
			for await (const values of rows) {
				if (outputError) throw outputError;
				if (sheetRows === 1048576) {
					finishSheet();
					sheet = createSheet();
					sheetRows = 1;
				}
				sheet.addRow(values).commit();
				sheetRows++;
			}
			finishSheet();
			await workbook.commit();
			await outputFinished;
			if (outputError) throw outputError;
		}
		return { filePath, fileName, contentType: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv; charset=utf-8', cleanup };
	} catch (error) {
		await csvFile?.close().catch(() => undefined);
		// Libera el escritor antes de retirar un archivo incompleto.
		if (output) {
			output.destroy();
			await outputFinished;
		}
		await cleanup();
		throw error;
	}
}
