export interface AttributeRequest {
	user: { id: string };
	requestId: string;
}

export interface CreateAttributeRes {
	data: string;
	message: string;
}

export interface CreateGroupAttributeRes {
	data: string;
	message: string;
}

export interface GetAttributeValuesRes {
	data: { id: string; value: string }[];
	message: string;
}

export interface CreateAttributeValueRes {
	data: { id: string; value: string; status: boolean; attributeId: string };
	message: string;
}

export interface CreateAttributeValuesRes {
	data: { id: string; value: string; status: boolean; attributeId: string }[];
	message: string;
}

export interface DeleteAttributeValueRes {
	data: boolean;
	message: string;
}

export interface GetAttributeRes {
	data: { id: string; name: string; status: boolean; unit: string | null; description: string | null };
	message: string;
}

export interface UpdateAttributeRes {
	data: { id: string; name: string; status: boolean; unit: string | null; description: string | null };
	message: string;
}

export interface GetAttributeGroupRes {
	data: {
		id: string;
		name: string;
		status: boolean;
		description: string;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
		categories: string[];
		attributeCategories: { id: string; categoryId: string; category: { id: string; name: string } }[];
	};
	message: string;
}

export interface UpdateAttributeGroupRes {
	data: {
		id: string;
		name: string;
		description: string;
		createdAt: Date;
		updatedAt: Date;
		statusAt: Date | null;
		categories: string[];
		status: boolean;
		attributeCategories: { id: string; categoryId: string; category: { id: string; name: string } }[];
	};
	message: string;
}

export interface GetAttributesRes {
	attributes: { id: string; name: string; status: boolean; valuesCount: number; attributeValues: string[] }[];
	meta: { totalAttributes: number; totalPages: number; currentPage: number; limit: number };
	filters: { filter: string; status: 'Todos' | 'Activos' | 'Inactivos'; sort: 'Predeterminado' | 'name:asc' | 'name:desc' | 'createdAt:asc' | 'createdAt:desc' };
}

export interface GetAttributesGroupsRes {
	attributeGroups: { id: string; name: string; description: string; status: boolean; createdAt: Date; categories: { id: string; name: string }[] }[];
	meta: { totalAttributesGroups: number; totalPages: number; currentPage: number; limit: number };
	filters: {
		filter: string;
		status: 'Todos' | 'Activos' | 'Inactivos';
		sort: 'Predeterminado' | 'name:asc' | 'name:desc' | 'createdAt:asc' | 'createdAt:desc';
		categories: string;
	};
}

export interface GetCategoriesByAttributeGroupRes {
	data: { attributeGroup: { id: string; name: string }; categories: { id: string; name: string }[] };
	message: string;
}

export interface UpdateAttributeStatusRes {
	data: { id: string; name: string; status: boolean };
	message: string;
}

export interface UpdateAttributeGroupStatusRes {
	data: { id: string; name: string; status: boolean };
	message: string;
}

export interface UpdateAttributesStatusRes {
	data: string[];
	message: string;
}

export interface UpdateAttributeGroupsStatusRes {
	data: string[];
	message: string;
}

export interface GetAttributesByCategoryRes {
	data: {
		id: string;
		name: string;
		attributes: { id: string; name: string; isFeatured: boolean; attributeValueId: string | null; attributeValues: { id: string; value: string }[] }[];
	}[];
	totalGroups: number;
	message: string;
}

export interface AttributeSelectItem {
	id: string;
	name: string;
	status: boolean;
}
