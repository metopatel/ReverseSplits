export interface DocumentResponse {
	_index: string
	_id: string
	_score: number
	_source: DocumentSource
}

export interface DocumentSource {
	ciks: string[]
	period_ending: string
	file_num: string[]
	display_names: string[]
	xsl: unknown
	sequence: string
	root_forms: string[]
	file_date: string
	biz_states: string[]
	sics: string[]
	form: string
	adsh: string
	film_num: string[]
	biz_locations: string[]
	file_type: string
	file_description: string
	inc_states: string[]
	items: string[]
}
