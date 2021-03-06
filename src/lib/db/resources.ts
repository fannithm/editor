import { ResourceType, UUID } from '@fannithm/const';
import { db } from 'src/lib/db/db';

export function createResource (resource: { id: UUID, name: string, projectId: number, type: ResourceType, blob: Blob }) {
	return db.resources.add({
		id: resource.id,
		name: resource.name,
		projectId: resource.projectId,
		type: resource.type,
		blob: resource.blob,
		createdAt: new Date().getTime(),
		updatedAt: new Date().getTime()
	});
}

export function getMetaResource (projectId: number) {
	return db.resources.get({
		projectId,
		type: ResourceType.Meta
	});
}

export function deleteResourceByProjectId (projectId: number) {
	return db.resources.where({ projectId }).delete();
}

export function updateBlobById (id: UUID, blob: Blob) {
	return db.resources.where('id').equals(id).modify({ blob });
}

export function getBlobById (id: UUID) {
	return db.resources.get({ id });
}
