export const ALLOWED_CONFIGURATION = [
	'Predeterminado',
	'isDimensions',
	'isCharacteristics',
	'isCondition',
	'isWarranty',
	'isCountryOfOrigin',
	'isMaterial',
	'isTemperature',
] as const;

export type AllowedConfiguration = typeof ALLOWED_CONFIGURATION[number];