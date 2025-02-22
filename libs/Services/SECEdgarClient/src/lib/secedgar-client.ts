import axios from "axios";
import moment from "moment";
import { APIResponse } from "./Models/APIResponse.js";
import { TickerResponse } from "./Models/TickerResponse.js";
import { DocumentResponse } from "./Models/DocumentResponse.js";

export class SECEdgarClient {

	private BaseURL = "https://efts.sec.gov";
	private SearchURL = `${this.BaseURL}/LATEST/search-index`
	private DefaultHeaders = {
		'Content-Type': 'application/json',
		'Accept': '*/*',
		'User-Agent': 'PostmanRuntime/7.43.0'
	}

	constructor() {
		return;
	}

	#buildQueryParameters(params: object)
	{
		return Object.entries(params).map(
			([k, v]) => {
				return `${k}=${v}`
			}
		).join('&');
	}

	async GetTickerInfo(ticker: string) : Promise<TickerResponse> {
		const params = {
			'keysTyped': ticker
		}

		const response = await axios.get(`${this.SearchURL}?${this.#buildQueryParameters(params)}`, {
			headers: this.DefaultHeaders
		});

		if (response.status != 200)
			throw Error(`unknown_error_status_${response.status}`);

		const responseData: APIResponse<TickerResponse> = response.data; 

		const hits = responseData.hits.hits;

		if (!hits || hits.length == 0)
			throw Error("tickers_not_found")

		const bestResult: TickerResponse = hits.sort((a: { _score: number; }, b: { _score: number; }) => {
			return a._score > b._score ? 1 : -1;
		})[0];

		return bestResult;
	}

	async GetMostRecentSECFilingDocumentURL(ticker : string): Promise<string> {
		const tickerInformation = await this.GetTickerInfo(ticker);
		if (tickerInformation) {
			const cik = tickerInformation._id.toString().padStart(10, "0");
			const entityName = `${tickerInformation._source.entity} (CIK ${cik})`;

			const params = {
				q: 'Fractional Shares',
				dateRange: '30d',
				entityName: entityName,
				startdt: moment().add(-30, 'days').format('YYYY-MM-DD'),
				enddt: moment().format('YYYY-MM-DD')
			}
			try {
				const response = await axios.get(`${this.SearchURL}?${this.#buildQueryParameters(params)}`, {
					headers: this.DefaultHeaders
				});

				if (response.status != 200)
					throw Error(`unknown_error_status_${response.status}`);

				const responseData : APIResponse<DocumentResponse> = response.data;

				const hits = responseData.hits.hits;

				if (!hits || hits.length == 0)
					throw Error("filings_not_found")

				const most_recent_filing = hits.sort((a: { _source: { file_date: moment.MomentInput; }; }, b: { _source: { file_date: moment.MomentInput; }; }) => {
					return moment(a._source.file_date) < moment(b._source.file_date) ? 1 : -1;
				})[0]

				const urlData = most_recent_filing._id.split(':');

				const adsh = urlData[0].replaceAll('-', '');
				const fileName = urlData[1];

				const filingDocumentUrl = `https://www.sec.gov/Archives/edgar/data/${tickerInformation._id}/${adsh}/${fileName}`

				return filingDocumentUrl;
			}
			catch (ex) {
				console.error(ex);
			}
		}
		return "";
	}
}