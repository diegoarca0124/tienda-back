import { Collaborator } from '@/entities/collaborator.entity';
import { FindCollaboratorsQueryDto } from '../dto/find-collaborators.dto';

export interface CreateCollaboratorRes {
	data: string;
	message: string;
}

export interface LoginRes {
	data: {
		accessToken: string;
		collaborator: Pick<Collaborator, 'id' | 'names' | 'surname' | 'email' | 'role'>;
	};
	message: string;
}

export interface ValidateTokenRes {
	valid: true;
	message: string;
}

export interface GetCollaboratorsRes {
	collaborators: Collaborator[];
	meta: {
		totalCollaborators: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: Pick<FindCollaboratorsQueryDto, 'filter' | 'status' | 'sort'>;
}

export interface GetCollaboratorRes {
	data: Collaborator;
	message: string;
}

export interface UpdateCollaboratorRes {
	data: Collaborator;
	message: string;
}

export interface UpdateCollaboratorStatusRes {
	data: Collaborator;
	message: string;
}

export interface UpdateCollaboratorsStatusRes {
	data: string[];
	message: string;
}

export interface RevokeCollaboratorSessionsRes {
	data: {
		id: string;
		revokedSessions: number;
	};
	message: string;
}

export interface ExportCollaboratorsRes {
	filePath: string;
	fileName: string;
	contentType: string;
	cleanup: () => Promise<void>;
}

export interface ImportCollaboratorsRes {
	message: string;
	created: number;
	updated: number;
	ignored: number;
}
