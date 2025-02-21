
import axios from "axios";
import moment from "moment";
//import moment from "moment";

const search_url = "https://efts.sec.gov/LATEST/search-index"

function buildQueryParameters(params: object) {
	return Object.entries(params).map(
		([k, v]) => {
			return `${k}=${v}`
		}
	).join('&');
}

async function getTickerInfo(ticker: string) {
	const params = {
		'keysTyped': ticker
	}

	try {
		const response = await axios.get(`${search_url}?${buildQueryParameters(params)}`, {
			headers: {
				'Content-Type': 'application/json',
				'Accept': '*/*',
				'User-Agent': 'PostmanRuntime/7.43.0'
			}
		});

		if (response.status != 200)
			throw Error(`unknown_error_status_${response.status}`);

		const hits = response.data.hits.hits;

		if (!hits || hits.length == 0)
			throw Error("tickers_not_found")

		const bestResult = hits.sort((a: { _score: number; }, b: { _score: number; }) => {
			return a._score > b._score ? 1 : -1;
		})[0];

		return bestResult;

	} catch (ex) {
		console.error(ex);
	}

}

export async function getMostRecentFractionShareSECFiling(): Promise<void> {
	const tickerInformation = await getTickerInfo('SXTP');
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
			const response = await axios.get(`${search_url}?${buildQueryParameters(params)}`, {
				headers: {
					'Content-Type': 'application/json',
					'Accept': '*/*',
					'User-Agent': 'PostmanRuntime/7.43.0'
				}
			});

			if (response.status != 200)
				throw Error(`unknown_error_status_${response.status}`);

			const hits = response.data.hits.hits;

			if (!hits || hits.length == 0)
				throw Error("filings_not_found")

			const most_recent_filing = hits.sort((a: { _source: { file_date: moment.MomentInput; }; },b: { _source: { file_date: moment.MomentInput; }; }) => {
				return moment(a._source.file_date) < moment(b._source.file_date) ? 1 : -1;
			})[0]

			const urlData = most_recent_filing._id.split(':');

			const adsh = urlData[0].replaceAll('-', '');
			const fileName = urlData[1];
			
			const filingDocumentUrl = `https://www.sec.gov/Archives/edgar/data/${tickerInformation._id}/${adsh}/${fileName}`

			console.log(filingDocumentUrl);
		}
		catch (ex)
		{
			console.error(ex);
		}

  }
}