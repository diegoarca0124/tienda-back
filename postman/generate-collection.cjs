const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'src');
const output = __dirname;
const files = new Map();
const classes = new Map();
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const decorators = (node) => (ts.getDecorators(node) || []).map((decorator) => decorator.expression).filter(ts.isCallExpression);
const decorator = (node, name) => decorators(node).find((expression) => expression.expression.getText() === name);
const ref = (name) => `{{${name}}}`;

for (const filename of walk(sourceRoot).filter((filename) => filename.endsWith('.ts'))) {
	const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
	const record = { source, imports: new Map(), constants: new Map(), classes: new Map() };
	for (const statement of source.statements) {
		if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
			const specifier = statement.moduleSpecifier.text;
			const base = specifier.startsWith('@/') ? path.join(sourceRoot, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
			const target = [base + '.ts', path.join(base, 'index.ts')].find(fs.existsSync);
			const bindings = statement.importClause?.namedBindings;
			if (target && bindings && ts.isNamedImports(bindings)) for (const binding of bindings.elements) record.imports.set(binding.name.text, { filename: target, name: binding.propertyName?.text || binding.name.text });
		}
		if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) record.constants.set(declaration.name.getText(), declaration.initializer);
		if (ts.isClassDeclaration(statement) && statement.name) {
			record.classes.set(statement.name.text, statement);
			classes.set(statement.name.text, { filename, node: statement });
		}
	}
	files.set(filename, record);
}

function literal(node, filename, depth = 0) {
	if (!node || depth > 8) return undefined;
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
	if (ts.isNumericLiteral(node)) return Number(node.text);
	if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
	if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
	if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) return literal(node.expression, filename, depth + 1);
	if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => literal(element, filename, depth + 1));
	if (ts.isIdentifier(node)) {
		const file = files.get(filename);
		if (file.constants.has(node.text)) return literal(file.constants.get(node.text), filename, depth + 1);
		const imported = file.imports.get(node.text);
		if (imported) return literal(files.get(imported.filename)?.constants.get(imported.name), imported.filename, depth + 1);
	}
	return undefined;
}

function resolveClass(name, filename) {
	const file = files.get(filename);
	if (file?.classes.has(name)) return { filename, node: file.classes.get(name) };
	const imported = file?.imports.get(name);
	if (imported) return resolveClass(imported.name, imported.filename);
	return classes.get(name);
}

const variables = {
	baseUrl: 'http://localhost:4000/api',
	token: '', loginEmail: '', loginPassword: '',
	collaboratorId: '', sessionUserId: '', categoryId: '', subcategoryId: '', brandId: '', attributeGroupId: '', attributeId: '', attributeValueId: '',
	productId: '', productGroupId: '', productVariationId: '', productPhotoId: '', productPhotoFilename: '', productDescriptionId: '',
	destinationCategoryId: '', destinationSubcategoryId: '',
	page: '1', limit: '10',
	categoryName: 'Categoria Postman', categoryPrefix: 'CPM', subcategoryName: 'Subcategoria Postman', subcategoryPrefix: 'SPM',
	brandName: 'Marca Postman', brandPrefix: 'MPM', attributeGroupName: 'Grupo Postman', attributeName: 'Color Postman', productName: 'Producto Postman',
	newCollaboratorEmail: 'postman@example.com', newCollaboratorPassword: 'Cambiar123!', newCollaboratorPhone: '987654321', newCollaboratorDocument: '12345678',
	galleryFilename: 'producto.jpg',
};

function resourceId(route) {
	const name = route.name.toLowerCase();
	if (route.module === 'collaborator') return 'collaboratorId';
	if (route.module === 'category') return name.includes('subcategory') || name.includes('subcategories') ? 'subcategoryId' : 'categoryId';
	if (route.module === 'brand') return 'brandId';
	if (route.module === 'attribute') {
		if (name === 'deleteattributevalue') return 'attributeValueId';
		if (name === 'getattributesbycategory') return 'categoryId';
		if (name === 'getattributes' || name.includes('group') || name === 'getcategoriesbyattributegroup') return 'attributeGroupId';
		return 'attributeId';
	}
	if (name === 'find_products_to_copy' || name === 'get_groups_for_create_product') return 'categoryId';
	if (name === 'delete_image_product') return 'productPhotoId';
	if (name.includes('status_variation') || name.includes('name_variation')) return 'productVariationId';
	if (name === 'update_feature_attribute') return 'productDescriptionId';
	return 'productId';
}

const country = { code: 'PE', name: 'Perú', flag: 'images/flags/PE.svg' };
function exampleProperty(property, filename, route, depth = 0) {
	const key = property.name.getText();
	const type = property.type;
	const typeText = type?.getText() || 'string';
	const uuid = decorator(property, 'IsUUID');
	const isArray = ts.isArrayTypeNode(type || {}) || !!decorator(property, 'IsArray');
	const names = {
		category: ref('categoryName'), brand: ref('brandName'), attribute: ref('attributeName'), product: ref('productName'),
	};
	const values = {
		names: 'Prueba', surname: 'Postman', phone: ref('newCollaboratorPhone'), type_document: 'DNI', number_document: ref('newCollaboratorDocument'), role: 'DEFAULT',
		email: route.name === 'login' ? ref('loginEmail') : ref('newCollaboratorEmail'), password: route.name === 'login' ? ref('loginPassword') : ref('newCollaboratorPassword'),
		description: 'Descripción de prueba desde Postman.', extract: 'Producto de prueba para el catálogo.', value: 'Azul', unit: 'kg',
		color: '#1b84ff', websiteUrl: 'https://example.com', country, countryOfOrigin: country,
		unitOfMeasure: { group: 'Unidad', name: 'Unidad', abbr: 'und' }, weightUnit: { group: 'Masa', name: 'Kilogramo', abbr: 'kg' },
		dimensionUnit: { group: 'Longitud', name: 'Centímetro', abbr: 'cm' }, storageTempUnit: { name: 'Celsius', abbr: '°C' },
		priceRegular: 100, priceDiscount: 80, minStock: 0, maxStock: 100, maxOrderLimit: 10, handlingDays: 2,
		weight: 1, height: 10, width: 10, length: 10, minStorageTemp: 5, maxStorageTemp: 25,
		condition: 'Nuevo', warranty: 'Garantía de fábrica', packageType: 'Caja', material: 'Cartón', specialInstructions: 'Manipular con cuidado.',
		tags: ['postman'], attributes: [], variations: [], isFeatured: false,
		cover: route.name === 'create_product' ? ref('galleryFilename') : ref('productPhotoFilename'),
		miniature: route.name === 'create_product' ? ref('galleryFilename') : ref('productPhotoFilename'),
		attributeId: ref('attributeId'), attributeValueId: ref('attributeValueId'), attributeGroupId: ref('attributeGroupId'),
		categoryId: route.name === 'moveSubcategory' || route.name === 'moveProductsToSubcategory' ? ref('destinationCategoryId') : ref('categoryId'),
		subcategoryId: route.name === 'moveProductsToSubcategory' ? ref('destinationSubcategoryId') : ref('subcategoryId'),
		brandId: ref('brandId'), productId: ref('productId'), productGroupId: ref('productGroupId'), groupId: ref('attributeGroupId'),
	};
	if (key === 'name') {
		if (/GroupAttribute/.test(route.bodyClass || '') || /AttributeGroup/.test(route.bodyClass || '')) return ref('attributeGroupName');
		if (/Subcategory/.test(route.bodyClass || '')) return ref('subcategoryName');
		if (route.name.includes('variation')) return 'Presentación Postman';
		return names[route.module] || 'Ejemplo Postman';
	}
	if (key === 'prefix') return ref(route.module === 'brand' ? 'brandPrefix' : /Subcategory/.test(route.bodyClass || '') ? 'subcategoryPrefix' : 'categoryPrefix');
	if (key === 'ids') return [ref(resourceId(route))];
	if (key === 'products') return [ref('productId')];
	if (key === 'categories') return [ref('categoryId')];
	if (key === 'status') return route.module === 'product' && /ProductDto$/.test(route.bodyClass || '') ? 'draft' : !route.name.startsWith('update_status_');
	if (key === 'visibility') return 'public';
	if (Object.hasOwn(values, key)) return values[key];
	const enumValues = literal(decorator(property, 'IsIn')?.arguments[0], filename);
	if (Array.isArray(enumValues) && enumValues.length) return isArray ? [enumValues[0]] : enumValues[0];
	if (uuid) return isArray ? [ref(resourceId(route))] : ref(key in variables ? key : resourceId(route));
	if (isArray) {
		const nested = type && ts.isArrayTypeNode(type) ? type.elementType : undefined;
		if (nested && ts.isTypeReferenceNode(nested) && depth < 4) return [exampleClass(nested.typeName.getText(), filename, route, depth + 1)];
		return decorator(property, 'ArrayNotEmpty') ? ['Ejemplo'] : [];
	}
	if (typeText === 'boolean' || decorator(property, 'IsBoolean')) return false;
	if (typeText === 'number' || decorator(property, 'IsNumber') || decorator(property, 'IsInt')) return Math.max(1, literal(decorator(property, 'Min')?.arguments[0], filename) || 0);
	if (type && ts.isTypeLiteralNode(type)) return Object.fromEntries(type.members.filter(ts.isPropertySignature).map((member) => [member.name.getText(), exampleProperty(member, filename, route, depth + 1)]));
	if (type && ts.isTypeReferenceNode(type) && resolveClass(type.typeName.getText(), filename) && depth < 4) return exampleClass(type.typeName.getText(), filename, route, depth + 1);
	return 'Ejemplo';
}

function exampleClass(name, filename, route, depth = 0) {
	const record = resolveClass(name, filename);
	if (!record) throw new Error(`No se encontró el DTO ${name}`);
	const result = {};
	for (const property of record.node.members.filter(ts.isPropertyDeclaration)) {
		if (!decorators(property).length || property.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword)) continue;
		const key = property.name.getText();
		if (['gallery', 'logoUrl', 'bannerUrl', 'updatedAt', 'fullnames'].includes(key)) continue;
		if (decorator(property, 'IsOptional') && !['unit', 'description', 'websiteUrl', 'value', 'name'].includes(key)) continue;
		result[key] = exampleProperty(property, record.filename, route, depth);
	}
	return result;
}

const routes = [];
for (const [filename, file] of files) for (const node of file.classes.values()) {
	const controller = decorator(node, 'Controller');
	if (!controller) continue;
	const module = literal(controller.arguments[0], filename) || '';
	for (const method of node.members.filter(ts.isMethodDeclaration)) {
		const mapping = decorators(method).find((expression) => ['Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options'].includes(expression.expression.getText()));
		if (!mapping) continue;
		const routePaths = literal(mapping.arguments[0], filename) || '';
		for (const routePath of Array.isArray(routePaths) ? routePaths : [routePaths]) {
			const route = { module, method: mapping.expression.getText().toUpperCase(), path: [module, routePath].filter(Boolean).join('/'), name: method.name.getText(), filename, source: path.relative(root, filename).replaceAll('\\', '/'), query: [], public: !!decorator(method, 'Public') || !!decorator(node, 'Public') };
			for (const parameter of method.parameters) {
				if (decorator(parameter, 'UploadedFiles')) route.multipart = true;
				if (decorator(parameter, 'Body')) {
					if (parameter.type && ts.isTypeReferenceNode(parameter.type)) route.bodyClass = parameter.type.typeName.getText();
					else if (parameter.type && ts.isTypeLiteralNode(parameter.type)) route.bodyLiteral = parameter.type;
				}
				const queryDecorator = decorator(parameter, 'Query');
				if (queryDecorator) {
					const pipe = queryDecorator.arguments.find(ts.isNewExpression);
					if (pipe?.arguments?.length) {
						route.queryClass = pipe.arguments[0].getText();
						const dto = resolveClass(route.queryClass, filename);
						route.query = dto.node.members.filter(ts.isPropertyDeclaration).map((property) => ({ name: property.name.getText(), optional: !!decorator(property, 'IsOptional') || !!property.questionToken }));
					} else if (parameter.type && ts.isTypeLiteralNode(parameter.type)) route.query = parameter.type.members.filter(ts.isPropertySignature).map((property) => ({ name: property.name.getText(), optional: !!property.questionToken }));
				}
			}
			routes.push(route);
		}
	}
}
// PrometheusModule registra este controlador desde una dependencia.
routes.push({ module: '', method: 'GET', path: 'metrics', name: 'metrics', source: 'src/app.module.ts', query: [], public: false });

const labels = {
	login: 'Iniciar sesión y guardar token', validateToken: 'Validar sesión', logout: 'Cerrar sesión', revokeCollaboratorSessions: 'Revocar sesiones de un colaborador',
	createCollaborator: 'Crear colaborador', getCollaborators: 'Listar colaboradores', getCollaborator: 'Obtener colaborador', updateCollaborator: 'Editar colaborador', updateCollaboratorStatus: 'Cambiar estado de colaborador', updateCollaboratorsStatus: 'Cambiar estado de varios colaboradores', exportCollaborators: 'Exportar colaboradores', importCollaborators: 'Importar colaboradores',
	createCategory: 'Crear categoría', getCategories: 'Listar categorías', getCategory: 'Obtener categoría', updateCategory: 'Editar categoría', updateCategoryStatus: 'Cambiar estado de categoría', updateCategoriesStatus: 'Cambiar estado de varias categorías',
	createSubcategory: 'Crear subcategoría', getSubcategories: 'Listar subcategorías de una categoría', updateSubcategory: 'Editar subcategoría', updateSubcategoryStatus: 'Cambiar estado de subcategoría', updateSubcategoriesStatus: 'Cambiar estado de varias subcategorías', moveSubcategory: 'Mover subcategoría', moveProductsToSubcategory: 'Mover productos a otra subcategoría', findCategoryProducts: 'Listar productos de una categoría', getBrandsByCategory: 'Listar marcas de una categoría', getCategoriesWithSubcategories: 'Listar categorías con subcategorías', get_categories_by_select: 'Categorías para selector', get_subcat_by_select: 'Categorías y subcategorías para selector', getSubcategoriesByCategorySelect: 'Subcategorías activas para selector',
	createBrand: 'Crear marca con imágenes', getBrands: 'Listar marcas', getBrand: 'Obtener marca', updateBrand: 'Editar marca', updateBrandStatus: 'Cambiar estado de marca', updateBrandsStatus: 'Cambiar estado de varias marcas', findBrandProducts: 'Listar productos de una marca', getBrandsSelect: 'Marcas para selector',
	createAttribute: 'Crear atributo y sus valores', createGroupAttribute: 'Crear grupo de atributos', getAttributes: 'Listar atributos de un grupo', getCategoriesByAttributeGroup: 'Obtener grupo y categorías', getAttributesGroups: 'Listar grupos de atributos', updateAttributeStatus: 'Cambiar estado de atributo', updateAttributesStatus: 'Cambiar estado de varios atributos', update_status_group_attribute: 'Cambiar estado de grupo (envía estado actual)', getAttribute: 'Obtener atributo', getAttributeGroup: 'Obtener grupo de atributos', getAttributeValues: 'Listar valores de atributo', createAttributeValue: 'Agregar valor a un atributo', deleteAttributeValue: 'Eliminar valor de atributo', updateAttribute: 'Editar atributo', updateAttributeGroup: 'Editar grupo de atributos', get_attributes_by_select: 'Atributos para selector', getAttributesByCategory: 'Atributos de una categoría', updateAttributeGroupsStatus: 'Cambiar estado de varios grupos',
	create_product: 'Crear producto con galería', get_products: 'Listar productos', get_groups_for_create_product: 'Grupos disponibles para crear producto', import_product_for_group: 'Consultar producto desde un grupo', get_product: 'Obtener producto', update_product: 'Editar producto', update_product_description: 'Editar características del producto', get_variations_product: 'Listar variaciones del producto', upload_images_product: 'Subir imágenes del producto', set_cover_product: 'Elegir portada', set_miniature_product: 'Elegir miniatura', delete_image_product: 'Eliminar imagen', create_variation_product: 'Crear variación', get_characteristics_product: 'Obtener características', get_photos_product: 'Listar fotos del producto', update_status_variation: 'Cambiar estado de variación (envía estado actual)', update_feature_attribute: 'Cambiar característica destacada', update_name_variation: 'Cambiar nombre de variación', update_group_in_product: 'Cambiar grupo del producto', find_products_to_copy: 'Buscar productos para copiar', getHello: 'Comprobar API', metrics: 'Consultar métricas Prometheus',
};

function pathVariable(route, parameter) {
	if (parameter !== 'id') return parameter;
	if (route.name === 'getSubcategories' || route.name === 'getSubcategoriesByCategorySelect') return 'categoryId';
	return resourceId(route);
}

function requestBody(route) {
	let body;
	if (route.bodyClass) body = exampleClass(route.bodyClass, route.filename, route);
	else if (route.bodyLiteral) body = Object.fromEntries(route.bodyLiteral.members.filter(ts.isPropertySignature).map((member) => [member.name.getText(), exampleProperty(member, route.filename, route)]));
	if (route.name === 'exportCollaborators') body = { format: 'xlsx', maskData: true, scope: 'all', sort: 'Predeterminado', data: [{ field: 'names', checked: true }, { field: 'email', checked: true }, { field: 'status', checked: true }] };
	if (route.name === 'importCollaborators') body = { mode: 'news', identifyBy: 'email', data: [{ names: 'Prueba', surname: 'Importada', email: 'postman-import@example.com', prefix: '+51', phone: '987654322', role: 'DEFAULT', type_document: 'DNI', number_document: '12345679', status: 'Activo' }] };
	if (route.name === 'upload_images_product') body = { productId: ref('productId') };
	if (route.name === 'update_feature_attribute') body = { isFeatured: false };
	if (!body) return undefined;
	if (route.multipart) {
		const formdata = Object.entries(body).map(([key, value]) => ({ key, value: typeof value === 'object' ? JSON.stringify(value) : String(value), type: 'text' }));
		if (route.module === 'brand') for (const key of ['logoUrl', 'bannerUrl']) formdata.push({ key, type: 'file', src: '', disabled: route.name === 'updateBrand', description: route.name === 'createBrand' ? 'Selecciona una imagen local. Obligatoria.' : 'Activa este campo si deseas reemplazar la imagen.' });
		if (route.module === 'product') formdata.push({ key: 'gallery', type: 'file', src: [], description: 'Selecciona entre 1 y 10 imágenes locales. En create_product, galleryFilename debe coincidir con el nombre de una imagen seleccionada.' });
		return { mode: 'formdata', formdata };
	}
	return { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } };
}

function captureScript(route) {
	const creations = { createCollaborator: 'collaboratorId', createCategory: 'categoryId', createSubcategory: 'subcategoryId', createBrand: 'brandId', createGroupAttribute: 'attributeGroupId', createAttribute: 'attributeId', createAttributeValue: 'attributeValueId', create_product: 'productId', create_variation_product: 'productVariationId' };
	if (route.name === 'login') return [
		'if (pm.response.code >= 200 && pm.response.code < 300) {',
		'  const body = pm.response.json();',
		'  if (body.data && body.data.accessToken) pm.collectionVariables.set("token", body.data.accessToken);',
		'  if (body.data && body.data.collaborator) pm.collectionVariables.set("sessionUserId", body.data.collaborator.id);',
		'}',
	];
	if (creations[route.name]) return [
		'if (pm.response.code >= 200 && pm.response.code < 300) {',
		'  const body = pm.response.json();',
		'  const data = body.data !== undefined ? body.data : body;',
		'  const id = typeof data === "string" ? data : data && data.id;',
		`  if (id) pm.collectionVariables.set(${JSON.stringify(creations[route.name])}, id);`,
		'}',
	];
	if (route.name === 'getAttributeValues') return [
		'if (pm.response.code >= 200 && pm.response.code < 300) {',
		'  const body = pm.response.json();',
		'  const values = Array.isArray(body) ? body : (body.data || body.values || body.attributeValues);',
		'  if (Array.isArray(values) && values[0] && values[0].id) pm.collectionVariables.set("attributeValueId", values[0].id);',
		'}',
	];
	if (route.name === 'get_photos_product') return [
		'if (pm.response.code >= 200 && pm.response.code < 300) {',
		'  const photos = pm.response.json();',
		'  if (Array.isArray(photos) && photos[0]) {',
		'    pm.collectionVariables.set("productPhotoId", photos[0].id);',
		'    pm.collectionVariables.set("productPhotoFilename", photos[0].url);',
		'  }',
		'}',
	];
	return [];
}

function requestItem(route) {
	const used = new Set();
	const requestPath = route.path.replace(/:([A-Za-z]\w*)/g, (_, parameter) => { const variable = pathVariable(route, parameter); used.add(variable); return ref(variable); });
	const query = route.query.map(({ name, optional }) => {
		const defaults = { filter: '', page: ref('page'), limit: ref('limit'), status: 'Todos', sort: 'Predeterminado', configurations: 'Predeterminado', categories: 'Todos', brands: 'Todos', countries: 'Todos', quality: 'Todos', visibility: 'Todos', minPrice: '0', maxPrice: '100', name: '', productId: ref('productId'), subcategoryIds: ref('subcategoryId'), brandIds: ref('brandId'), categoryIds: ref('categoryId') };
		return { key: name, value: defaults[name] ?? '', disabled: optional || ['minPrice', 'maxPrice'].includes(name), description: optional ? 'Filtro opcional: actívalo para usarlo.' : undefined };
	});
	const enabledQuery = query.filter((entry) => !entry.disabled).map((entry) => `${entry.key}=${entry.value}`).join('&');
	const raw = ref('baseUrl') + (requestPath ? '/' + requestPath : '') + (enabledQuery ? '?' + enabledQuery : '');
	const description = [
		`**${route.method} /api/${route.path}**`,
		`Implementación: \`${route.source}\` → \`${route.name}\`.`,
		'Configura baseUrl y token en las variables de esta colección. Ejecuta primero Autenticación / Iniciar sesión.',
	];
	if (used.size) description.push(`IDs necesarios: ${[...used].map(ref).join(', ')}. Deben existir en tu base de datos.`);
	if (route.bodyClass) description.push(`Cuerpo basado en \`${route.bodyClass}\`. Los ejemplos usan datos ficticios; ajusta los campos a tus registros.`);
	if (route.multipart) description.push('Body → form-data: selecciona los archivos locales. Postman establece automáticamente Content-Type y boundary; no agregues ese encabezado manualmente. Los objetos y listas se envían como JSON en los campos de texto.');
	if (route.name === 'create_product') description.push('Primero configura categoryId, subcategoryId y brandId con registros relacionados. galleryFilename debe coincidir exactamente con el nombre de una imagen seleccionada en gallery, pues se usa para portada y miniatura. El ejemplo crea un borrador.');
	if (route.name.startsWith('update_status_') && !route.name.endsWith('attributes')) description.push('Este endpoint antiguo invierte el estado recibido: status representa el estado ACTUAL. Los endpoints camelCase de estado reciben el estado DESTINO.');
	if (route.name === 'update_feature_attribute') description.push('Este endpoint recibe el ID de ProductDescription (productDescriptionId), no attributeId ni attributeValueId. Envía el valor ACTUAL de isFeatured: el backend lo invierte. Puedes obtener el ID en get_characteristics_product.');
	if (route.name === 'exportCollaborators') description.push('Para guardar el archivo usa Send and Download. Cambia format a csv si prefieres CSV. El ejemplo exporta todos los registros con datos enmascarados.');
	if (route.name === 'importCollaborators') description.push('Este endpoint recibe registros JSON; el archivo Excel/CSV se procesa en el panel antes del envío. El ejemplo contiene un único registro ficticio.');
	if (route.name.includes('move')) description.push('Configura destinationCategoryId y, cuando corresponda, destinationSubcategoryId. Los IDs de origen y destino deben corresponder a categorías/subcategorías existentes.');
	if (route.name === 'logout' || route.name === 'revokeCollaboratorSessions') description.push('Al ejecutarlo puedes invalidar la sesión o los tokens relacionados. Vuelve a iniciar sesión si recibes 401 después.');
	if (route.name === 'metrics') description.push('Ruta registrada por PrometheusModule con el prefijo global /api. La aplicación configura defaultMetrics.enabled=false, por lo que la respuesta puede estar vacía.');
	const body = requestBody(route);
	const request = { method: route.method, header: [{ key: 'Accept', value: route.name === 'exportCollaborators' || route.name === 'metrics' ? '*/*' : 'application/json' }], url: { raw, host: [ref('baseUrl')], path: requestPath ? requestPath.split('/') : [], query }, description: description.join('\n\n') };
	if (route.public) request.auth = { type: 'noauth' };
	if (body) {
		request.body = body;
		if (body.mode === 'raw') request.header.push({ key: 'Content-Type', value: 'application/json' });
	}
	const script = ['pm.test("Respuesta exitosa (2xx)", function () {', '  pm.expect(pm.response.code).to.be.within(200, 299);', '});', ...captureScript(route)];
	return { name: `${route.method} · ${labels[route.name] || route.name}`, request, event: [{ listen: 'test', script: { type: 'text/javascript', exec: script } }], response: [] };
}

function folderFor(route) {
	if (['login', 'validateToken', 'logout'].includes(route.name)) return ['00 · Autenticación', route.name === 'logout' ? '03 · Cerrar sesión' : '01 · Sesión'];
	if (route.module === 'collaborator') return ['01 · Colaboradores', route.name === 'revokeCollaboratorSessions' ? '04 · Sesiones' : /import|export/i.test(route.name) ? '03 · Importación y exportación' : /Status/.test(route.name) ? '02 · Estados' : '01 · Crear, consultar y editar'];
	if (route.module === 'category') return ['02 · Categorías', /move/.test(route.name) ? '04 · Movimientos' : /Subcategor|subcat/.test(route.name) ? '02 · Subcategorías' : /findCategoryProducts|getBrandsByCategory/.test(route.name) ? '03 · Productos y marcas' : '01 · Categorías'];
	if (route.module === 'brand') return ['03 · Marcas', /findBrandProducts/.test(route.name) ? '02 · Productos' : '01 · Crear, consultar, editar y estados'];
	if (route.module === 'attribute') return ['04 · Atributos', /Group|group/.test(route.name) ? '01 · Grupos de atributos' : /value|values/.test(route.name) ? '03 · Valores' : '02 · Atributos'];
	if (route.module === 'product') return ['05 · Productos', /image|cover|miniature|photos/.test(route.name) ? '03 · Galería' : /variation/.test(route.name) ? '04 · Variaciones' : /description|characteristics|feature_attribute/.test(route.name) ? '05 · Características' : /group|copy/.test(route.name) ? '02 · Grupos y copias' : '01 · Crear, consultar y editar'];
	return ['06 · Sistema', '01 · Diagnóstico'];
}

const collection = {
	info: { _postman_id: crypto.randomUUID(), name: 'Shop · API completa', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Colección generada desde los controladores y DTOs actuales del backend.\n\n1. Configura baseUrl (incluye /api), loginEmail y loginPassword en Variables.\n2. Ejecuta Autenticación → Iniciar sesión: el token se guarda automáticamente.\n3. Configura los IDs o ejecuta las solicitudes de creación, cuyos IDs se guardan automáticamente.\n4. Selecciona archivos locales para las solicitudes multipart.\n\nLas peticiones están preparadas para ejecutarse individualmente. No se ha llamado a ningún endpoint para crear, editar o borrar datos al generar esta colección. Los nombres y datos de ejemplo son ficticios. Algunas rutas mantienen nombres antiguos porque así aparecen actualmente en tus controladores.\n\nLas pruebas integradas esperan una respuesta 2xx. Un 400/401/404 puede indicar variables pendientes, registros inexistentes o validaciones de negocio. No contiene credenciales reales.' },
	auth: { type: 'bearer', bearer: [{ key: 'token', value: ref('token'), type: 'string' }] },
	variable: Object.entries(variables).map(([key, value]) => ({ key, value, type: 'string', description: key === 'baseUrl' ? 'URL del backend con prefijo /api y sin barra final.' : key === 'token' ? 'Se completa al ejecutar login.' : key.endsWith('Id') ? 'ID de un registro existente; las creaciones guardan automáticamente sus IDs cuando la respuesta lo permite.' : undefined })),
	item: [],
};

const rank = (route) => route.name === 'login' ? 0 : /^(create|add)/.test(route.name) ? 10 : /^(get|find|import_product)/.test(route.name) ? 20 : /^update/.test(route.name) ? 30 : /^set/.test(route.name) ? 35 : /^delete/.test(route.name) ? 90 : 50;
routes.sort((a, b) => folderFor(a).join('/').localeCompare(folderFor(b).join('/')) || rank(a) - rank(b) || (labels[a.name] || a.name).localeCompare(labels[b.name] || b.name));
for (const route of routes) {
	let parent = collection.item;
	for (const name of folderFor(route)) {
		let folder = parent.find((entry) => entry.name === name);
		if (!folder) { folder = { name, item: [] }; parent.push(folder); }
		parent = folder.item;
	}
	parent.push(requestItem(route));
}

function flatten(items) { return items.flatMap((item) => item.item ? flatten(item.item) : [item]); }
const requests = flatten(collection.item);
if (requests.length !== routes.length) throw new Error('Falta cobertura de rutas');
const expected = new Set(routes.map((route) => `${route.method} /${route.path}`));
const actual = new Set(requests.map((item) => `${item.request.method} /${item.request.url.path.map((part) => part.replace(/\{\{.*?\}\}/g, ':id')).join('/')}`));
if (expected.size !== routes.length) throw new Error('Hay rutas duplicadas en los controladores');
for (const item of requests) if (item.request.body?.mode === 'raw') JSON.parse(item.request.body.raw);
const text = JSON.stringify(collection, null, 2) + '\n';
const referenced = [...text.matchAll(/\{\{([^{}]+)\}\}/g)].map((match) => match[1]);
for (const name of referenced) if (!(name in variables)) throw new Error(`Variable sin definir: ${name}`);
fs.writeFileSync(path.join(output, 'Shop-API.postman_collection.json'), text);
const summary = { generatedFrom: 'Controladores de src/ y PrometheusModule', requestCount: requests.length, modules: Object.fromEntries(['collaborator', 'category', 'brand', 'attribute', 'product', ''].map((module) => [module || 'system', routes.filter((route) => route.module === module).length])), routes: routes.map((route) => ({ method: route.method, path: '/api/' + route.path, handler: route.name, source: route.source, bodyClass: route.bodyClass, queryClass: route.queryClass })) };
fs.writeFileSync(path.join(output, 'routes-manifest.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ requests: requests.length, modules: summary.modules, collection: path.join(output, 'Shop-API.postman_collection.json') }));
