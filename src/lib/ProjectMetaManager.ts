import { DiffColor, MapType, ResourceType, UUID } from '@fannithm/const';
import { MapResource, OtherResource, ProjectMeta } from 'src/lib/project';
import { v4 as uuid } from 'uuid';
import { IProject } from 'src/lib/db/db';
import { sanitizeFilename } from 'src/lib/utils';
import { createResource, updateBlobById } from 'src/lib/db/resources';

export default class ProjectMetaManager {
	private uuids: { [key: string]: ResourceType } = {};
	public project: IProject;
	public name: string;
	public songName: string;
	public songNameRomanized: string;
	public artist: string;
	public artistRomanized: string;
	public resources: {
		[ResourceType.Other]: OtherResource[];
		[ResourceType.Meta]: OtherResource,
		[ResourceType.Map]: MapResource[];
		[ResourceType.Audio]: OtherResource[];
		[ResourceType.Image]: OtherResource[];
		[ResourceType.Video]: OtherResource[];
		[ResourceType.Script]: OtherResource[]
	};

	constructor (project: IProject, meta: {
		name: string,
		songName: string,
		songNameRomanized: string,
		artist: string,
		artistRomanized: string
	}) {
		this.project = project;
		this.name = meta.name;
		this.songName = meta.songName;
		this.songNameRomanized = meta.songNameRomanized;
		this.artist = meta.artist;
		this.artistRomanized = meta.artistRomanized;
		this.resources = {
			[ResourceType.Other]: [],
			[ResourceType.Meta]: {
				id: this.getUUID(ResourceType.Meta),
				name: 'meta.json',
				type: ResourceType.Meta
			},
			[ResourceType.Map]: [],
			[ResourceType.Audio]: [],
			[ResourceType.Image]: [],
			[ResourceType.Video]: [],
			[ResourceType.Script]: []
		};
	}

	fileExist (filename: string): boolean {
		return Object.values(this.resources).flat().some(v => v.name === filename);
	}

	uniqueFilename (filename: string): string {
		const filenameSplit = filename.split('.');
		return !this.fileExist(filename) ? filename : this.uniqueFilename(
			filenameSplit.slice(0, -1).join('.') + '_.' + filenameSplit[filenameSplit.length - 1]
		);
	}

	getUUID (type: ResourceType): UUID {
		const id = uuid();
		if (this.uuids[id]) return this.getUUID(type);
		this.uuids[id] = type;
		return id;
	}

	async save () {
		await updateBlobById(this.resources[ResourceType.Meta].id, new Blob([
			JSON.stringify(this.toJSON())
		], { type: 'application/json' }));
	}

	async addMap (map: {
		mapType: MapType;
		difficulty: string;
		level: number;
		music: UUID;
		bg: UUID;
		color: DiffColor
	}): Promise<UUID> {
		const id = this.getUUID(ResourceType.Map);
		const name = this.uniqueFilename(sanitizeFilename(map.difficulty.toLowerCase()) + '.json');
		const { bg, difficulty, level, color, mapType, music } = map;
		this.resources[ResourceType.Map].push({
			id,
			name,
			offset: 0,
			type: ResourceType.Map,
			bg,
			difficulty, // TODO illegal characters
			level,
			color,
			mapType,
			music,
			scripts: []
		});
		await createResource({
			id,
			name,
			type: ResourceType.Map,
			projectId: this.project.id as number,
			blob: new Blob(['{}'], { type: 'application/json' })
		});
		return id;
	}

	async addResource (resource: {
		name: string,
		type: ResourceType.Image | ResourceType.Audio | ResourceType.Video,
		blob: Blob
	}): Promise<UUID> {
		const id = this.getUUID(resource.type);
		const { name, type, blob } = resource;
		this.resources[type].push({
			id,
			name,
			type
		});
		await createResource({
			id,
			name,
			projectId: this.project.id as number,
			type,
			blob
		});
		return id;
	}

	toJSON (): string {
		return JSON.stringify({
			name: this.name,
			songName: this.songName,
			songNameRomanized: this.songNameRomanized,
			artist: this.artist,
			artistRomanized: this.artistRomanized,
			uuids: this.uuids,
			resources: this.resources
		} as ProjectMeta);
	}

	static parseJSON (project: IProject, json: string): ProjectMetaManager {
		const data = JSON.parse(json) as ProjectMeta;
		const metaManager = new ProjectMetaManager(project, {
			name: data.name,
			songName: data.songName,
			songNameRomanized: data.songNameRomanized,
			artist: data.artist,
			artistRomanized: data.artistRomanized
		});

		metaManager.uuids = data.uuids;

		metaManager.resources = data.resources;

		return metaManager;
	}
}
