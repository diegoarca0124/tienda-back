import type { Attribute } from '@/entities/attribute.entity';
import type { AttributeValue } from '@/entities/attribute-value.entity';
import type { AttributeGroup } from '@/entities/attribute-group.entity';
import type { Category } from '@/entities/category.entity';
import type { FindAttributesQueryDto } from '../dto/find-attributes.dto';
import type { FindAttributesGroupsQueryDto } from '../dto/find-attributes-groups.dto';

export interface CreateAttributeRes {
	data: string;
	message: string;
}

export interface GetAttributeValuesRes {
	data: Pick<AttributeValue, 'id' | 'value'>[];
	message: string;
}

export interface CreateAttributeValueRes {
	data: Pick<AttributeValue, 'id' | 'value' | 'status' | 'attributeId'>;
	message: string;
}

export interface DeleteAttributeValueRes {
	data: boolean;
	message: string;
}

export interface CreateGroupAttributeRes {
	data: string;
	message: string;
}

export interface GetAttributeRes {
	data: Pick<Attribute, 'id' | 'name' | 'description' | 'unit'>;
	message: string;
}

export interface GetAttributeGroupRes {
	data: Pick<AttributeGroup, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt' | 'statusAt' | 'attributeCategories'> & {
		categories: string[];
	};
	message: string;
}

export interface AttributeListItem extends Pick<Attribute, 'id' | 'name' | 'status'> {
	valuesCount: number;
	attributeValues: string[];
}

export interface GetAttributesRes {
	attributes: AttributeListItem[];
	meta: {
		totalAttributes: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: Pick<FindAttributesQueryDto, 'filter' | 'status' | 'sort'>;
}

export interface GetCategoriesByAttributeGroupRes {
	data: {
		attributeGroup: Pick<AttributeGroup, 'id' | 'name'>;
		categories: Pick<Category, 'id' | 'name'>[];
	};
	message: string;
}

export interface AttributeGroupListItem extends Pick<AttributeGroup, 'id' | 'name' | 'description' | 'status' | 'createdAt'> {
	categories: Pick<Category, 'id' | 'name'>[];
}

export interface GetAttributesGroupsRes {
	attributeGroups: AttributeGroupListItem[];
	meta: {
		totalAttributesGroups: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: Pick<FindAttributesGroupsQueryDto, 'filter' | 'status' | 'sort' | 'categories'>;
}

export interface UpdateAttributeStatusRes {
	data: Pick<Attribute, 'id' | 'name' | 'status'>;
	message: string;
}

export interface UpdateAttributesStatusRes {
	data: string[];
	message: string;
}

export interface UpdateAttributeGroupStatusRes {
	data: Pick<AttributeGroup, 'id' | 'name' | 'status'>;
	message: string;
}

export interface UpdateAttributeGroupsStatusRes {
	data: string[];
	message: string;
}

export interface UpdateAttributeRes {
	data: Pick<Attribute, 'id' | 'status' | 'name' | 'unit' | 'description'>;
	message: string;
}

export interface UpdateAttributeGroupRes {
	data: Pick<AttributeGroup, 'id' | 'status' | 'name' | 'description' | 'attributeCategories'>;
	message: string;
}

export interface CategoryAttributeItem extends Pick<Attribute, 'id' | 'name'> {
	isFeatured: boolean;
	attributeValueId: string | null;
	attributeValues: Pick<AttributeValue, 'id' | 'value'>[];
}

export interface CategoryAttributeGroupItem extends Pick<AttributeGroup, 'id' | 'name'> {
	attributes: CategoryAttributeItem[];
}

export interface GetAttributesByCategoryRes {
	data: CategoryAttributeGroupItem[];
	totalGroups: number;
	message: string;
}
