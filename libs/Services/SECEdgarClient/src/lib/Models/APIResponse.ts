export interface APIResponse<T> {
	took: number
	timed_out: boolean
	_shards: Shards
	hits: Hits<T>
}

export interface Shards {
	total: number
	successful: number
	skipped: number
	failed: number
}

export interface Hits<T> {
	total: Total
	max_score: number
	hits: T[]
}

export interface Total {
	value: number
	relation: string
}
