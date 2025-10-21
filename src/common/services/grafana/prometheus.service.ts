import { Counter, Gauge, Histogram, register } from 'prom-client';
import os from 'os';

// Limpiar métricas previas
register.clear();

// Gauges
const systemCpuUsagePercent = new Gauge({
	name: 'system_cpu_usage_percent',
	help: 'Porcentaje de uso de CPU del sistema',
});

const processCpuUsagePercent = new Gauge({
	name: 'process_cpu_usage_percent',
	help: 'Porcentaje de uso de CPU del proceso Node.js',
});

const systemRamUsageBytes = new Gauge({
	name: 'system_ram_usage_bytes',
	help: 'Uso de memoria RAM del sistema en bytes',
});

const processRamUsageBytes = new Gauge({
	name: 'process_ram_usage_bytes',
	help: 'Uso de memoria RAM del proceso Node.js en bytes',
});

// Variables para delta de proceso
let lastCpuUsage = process.cpuUsage();
let lastTime = Date.now();

export class PrometheusService {
	static updateSystemMetrics() {
		// 🔹 CPU sistema
		const cpus = os.cpus();
		let totalIdle = 0;
		let totalTick = 0;
		cpus.forEach((core) => {
			for (const type in core.times) {
				totalTick += (core.times as any)[type];
			}
			totalIdle += core.times.idle;
		});
		const idle = totalIdle / cpus.length;
		const total = totalTick / cpus.length;
		systemCpuUsagePercent.set(Number((100 - (100 * idle) / total).toFixed(2)));

		// 🔹 CPU proceso Node.js (corregido)
		const now = Date.now();
		const cpu = process.cpuUsage();
		const elapsedTime = (now - lastTime) / 1000; // segundos transcurridos

		const userDelta = (cpu.user - lastCpuUsage.user) / 1000; // ms
		const systemDelta = (cpu.system - lastCpuUsage.system) / 1000; // ms
		const totalDelta = userDelta + systemDelta;

		// Porcentaje real de CPU usado por el proceso en el intervalo
		const usagePercent = (totalDelta / (elapsedTime * 1000)) * 100; // aprox.
		processCpuUsagePercent.set(Number(usagePercent.toFixed(2)));

		// Actualizar referencias para la siguiente llamada
		lastCpuUsage = cpu;
		lastTime = now;

		// 🔹 RAM sistema y proceso se mantienen igual
		const usedMem = os.totalmem() - os.freemem();
		systemRamUsageBytes.set(usedMem);

		const memoryUsage = process.memoryUsage();
		processRamUsageBytes.set(memoryUsage.rss);
	}
}
