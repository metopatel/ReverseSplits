export interface TickerResponse {
	_index: string
	_id: string
	_score: number
	_source: TickerSource
}

export interface TickerSource {
	entity: string
	entity_words: string
	tickers: string
	rank: number
}