import axios from "axios";
import { Stock } from "./Models/Stock.js";

export class HedgeFollowClient {

	private BaseURL = "https://hedgefollow.com";
	private ARRAYKEY = [12, 124, 43, 99];
	/**
	 *
	 */
	constructor() {
		return;
	}

	#generateT() {
		const array = [...Array(3)].map(_ => Math.floor(Math.random() * 10000))
		const timestamp = Math.floor(Date.now() / 1000)
		const divisor = this.#getRandomInt(11, 19)
		const power = Math.round(Math.random()) + 1;

		const token = this.#getToken(array, timestamp, power, divisor);
		return {
			'arr': array,
			'ts': timestamp,
			'd': divisor,
			'p': power,
			'tk': token,
			'mts': Date.now()
		};
	}

	#getToken(array: number[], timestamp: number, power: number, divisor: number) {
		let computedResult = 0;
		for (let i = 0; i < array.length; i++)
			computedResult += ((-1) ** (power + i) * array[i]);
		return Math.floor((timestamp + computedResult) / divisor);
	}

	#getRandomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min) + min);
	}

	#decodeResponse(str: string, k: number[]) {
		let enc = "";
		for (let i = 0; i < str.length; i++) {
			const a = str.charCodeAt(i);

			const b = a ^ k[i % 4];
			enc = enc + String.fromCharCode(b);
		}
		return enc;
	}

	async GetStocks(): Promise<Stock[]> {
		const data = {
			params: {
				'page': 'filler',
				'requestId': 'latest_stock_splits',
				'filteredCt': 100,
				'totalCt': 100,
				'limit_per_page': 100,
				'offset': 0,
				'sortVar': 'exDate',
				'sortOrder': -1
			},
			'symbol': 'filler',
			'infotrac': 'anotherfiller',
			'id_params': this.#generateT()
		}


		const response = await axios.post(`${this.BaseURL}/ggg/web_request.php`, data, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		});

		const stockData = `[${this.#decodeResponse(atob(response.data), this.ARRAYKEY).split(';')[0].split('= ')[1].split('],')[0].split(': [')[1]}]`;

		return JSON.parse(stockData);
	}
}