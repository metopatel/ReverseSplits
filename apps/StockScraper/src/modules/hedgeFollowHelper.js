'use strict'

import * as axios from 'axios';
import { getMysqlConnection } from '@reverse-splits/mysqlConnector'
import * as moment from 'moment-timezone';

class HedgeFollowHelper {
    constructor() {
        this.defs = {
            THREAD: {
                INTERVAL: 15 * 60 * 1000 //15 minutes
            }
        }

        this.ARRAYKEY = [12, 124, 43, 99]

        this.init().then(() => {
            this.mainThread();
        });
    }

    init() {
        return new Promise(async (res) => {
            this.mysqlConnection = await getMysqlConnection();
            res();
        })
    }

    replayThread() {
        setTimeout(this.mainThread.bind(this), this.defs.THREAD.INTERVAL);
    }

    async mainThread() {
        try {
            const stocks = await this.#getStocks();

            const upcomingSplits = stocks.filter((s) => {
                const date = moment(s['exDate']).tz('America/New_York');
                const currentDate = moment(moment().format('YYYY-MM-DD'));
                if (s['ratio_decimal'] < 1 && s['exchange'] == 'NASDAQ' && date > currentDate) return true;
                return false;
            });



            for (const stock of upcomingSplits) {
                //Sanitize Values
                Object.keys(stock).forEach((k) => {
                    if (stock[k] && typeof stock[k] == "string") {
                        if (stock[k] == 'N/A')
                            stock[k] = null;
                    } else {
                        if (stock[k] == undefined)
                            stock[k] = null;
                    }
                });

                if (!await this.#checkIfStockExists(stock['symbol'], stock['exDate'])) {
                    //INSERT RECORD
                    await this.#insertStock(stock['symbol'], stock['exchange'], stock['company_name'], stock['exDate'], stock['annDate'], stock['splitRatio'], stock['ratio_numerator'], stock['ratio_denominator'], stock['ratio_decimal']);
                }
            }
        } catch (err) {
            console.error(`[HEDGEFOLLOW SCRAPER] => ${err.stack}`)
        } finally {
            this.replayThread();
        }
    }

    #decodeResponse(str, k) {
        let enc = "";
        for (let i = 0; i < str.length; i++) {
            const a = str.charCodeAt(i);

            const b = a ^ k[i % 4];
            enc = enc + String.fromCharCode(b);
        }
        return enc;
    }

    #getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    #getToken(array, timestamp, power, divisor) {
        let computedResult = 0;
        for (let i = 0; i < array.length; i++)
            computedResult += ((-1) ** (power + i) * array[i]);
        return Math.floor((timestamp + computedResult) / divisor);
    }


    #genT() {
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

    async #getStocks() {
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
            'id_params': this.#genT()
        }


        const response = await axios.post('https://hedgefollow.com/ggg/web_request.php', data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const stockData = `[${this.#decodeResponse(atob(response.data), this.ARRAYKEY).split(';')[0].split('= ')[1].split('],')[0].split(': [')[1]}]`;
        
        return JSON.parse(stockData);
    }

    async #checkIfStockExists(ticker, exDate) {
        const [results] = await this.mysqlConnection.execute('SELECT * FROM stocks WHERE symbol=? AND exDate=?', [ticker, exDate]);

        if (results.length > 0) return true;
        return false;
    }

    async #insertStock(symbol, exchange, companyName, exDate, annDate, splitRatio, ratio_num, ratio_den, ratio_dec) {
        const stockInsert = await this.mysqlConnection.execute(
            'INSERT INTO stocks (symbol, exchange, companyName, exDate, annDate, splitRatio, splitNumerator, splitDenominator, ratioDecimal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [symbol, exchange, companyName, exDate, annDate, splitRatio, ratio_num, ratio_den, ratio_dec]
        );

        return stockInsert[0].insertId;
    }
}

module.exports = HedgeFollowHelper