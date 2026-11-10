export interface LogoutRes {
	success: true;
	revoked: boolean;
	message: string;
}
export interface CollaboratorRequest {
	user: { id: string; jti?: string; exp?: number };
	requestId: string;
}

export interface CreateCollaboratorRes {
	data: string;
	message: string;
}

export interface LoginRes {
	data: {
		accessToken: string;
		collaborator: { id: string; names: string; surname: string; email: string; role: string | null };
	};
	message: string;
}

export interface ValidateTokenRes {
	valid: true;
	message: string;
}

export interface GetCollaboratorsRes {
	collaborators: {
		id: string;
		names: string;
		surname: string;
		email: string;
		status: boolean;
		number_document: string;
		createdAt: Date;
		fullnames: string | null;
		type_document: string | null;
		prefix: string | null;
		phone: string | null;
		role: string | null;
	}[];
	meta: {
		totalCollaborators: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
	filters: {
		filter: string;
		status: 'Todos' | 'Activos' | 'Inactivos';
		sort: 'Predeterminado' | 'names:asc' | 'names:desc' | 'email:asc' | 'email:desc' | 'number_document:asc' | 'number_document:desc';
	};
}

export interface GetCollaboratorRes {
	data: {
		id: string;
		names: string;
		surname: string;
		email: string;
		status: boolean;
		number_document: string;
		createdAt: Date;
		type_document: string | null;
		prefix: string | null;
		phone: string | null;
		role: string | null;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}

export interface UpdateCollaboratorRes {
	data: {
		id: string;
		names: string;
		surname: string;
		email: string;
		status: boolean;
		number_document: string;
		createdAt: Date;
		type_document: string | null;
		prefix: string | null;
		phone: string | null;
		role: string | null;
		updatedAt: Date;
		statusAt: Date | null;
	};
	message: string;
}

export interface UpdateCollaboratorStatusRes {
	data: { id: string; names: string; status: boolean; statusAt: Date | null };
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

/** Only used after ImportCollaboratorsInterceptor validates and normalizes every row. */
export interface NormalizedImportedCollaborator {
	names: string;
	surname: string;
	phone: string;
	role: string;
	fullnames?: string;
	email: string;
	type_document: string;
	number_document: string;
	prefix?: string;
	index?: number;
	status: boolean;
}
