import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const ALLOWED_SVG_TAGS = [
	'svg',
	'g',
	'path',
	'circle',
	'ellipse',
	'rect',
	'line',
	'polyline',
	'polygon',
	'title',
	'desc',
	'defs',
	'linearGradient',
	'radialGradient',
	'stop',
];

const ALLOWED_SVG_ATTRIBUTES = [
	'xmlns',
	'viewBox',
	'width',
	'height',
	'fill',
	'fill-opacity',
	'stroke',
	'stroke-width',
	'stroke-linecap',
	'stroke-linejoin',
	'stroke-opacity',
	'opacity',
	'd',
	'x',
	'y',
	'x1',
	'y1',
	'x2',
	'y2',
	'cx',
	'cy',
	'r',
	'rx',
	'ry',
	'points',
	'transform',
	'offset',
	'stop-color',
	'stop-opacity',
	'fill-rule',
	'clip-rule',
];

export function sanitizeSvg(code: string): {
	valid: boolean;
	sanitized?: string;
	reason?: string;
} {
	if (typeof code !== 'string' || !code.trim()) {
		return {
			valid: false,
			reason: 'El código SVG está vacío.',
		};
	}

	if (code.length > 2000) {
		return {
			valid: false,
			reason: 'El código SVG supera la longitud permitida.',
		};
	}

	const sanitized = DOMPurify.sanitize(code.trim(), {
		USE_PROFILES: {
			svg: true,
			svgFilters: false,
		},
		ALLOWED_TAGS: ALLOWED_SVG_TAGS,
		ALLOWED_ATTR: ALLOWED_SVG_ATTRIBUTES,
		FORBID_TAGS: [
			'script',
			'style',
			'foreignObject',
			'iframe',
			'object',
			'embed',
			'image',
			'use',
			'a',
			'animate',
			'set',
		],
		FORBID_ATTR: ['style', 'href', 'xlink:href'],
	});

	if (!/^<svg[\s\S]*<\/svg>\s*$/i.test(sanitized)) {
		return {
			valid: false,
			reason: 'El contenido no es un SVG válido.',
		};
	}

	return {
		valid: true,
		sanitized,
	};
}