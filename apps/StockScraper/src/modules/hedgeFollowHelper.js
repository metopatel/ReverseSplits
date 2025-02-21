
import { getMysqlConnection } from '@reverse-splits/mysqlConnector'
import * as moment from 'moment-timezone';
import { getStocks } from '@reverse-splits/HedgeFollowUtils';

class HedgeFollowScraper {
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
            const stocks = await getStocks();

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

module.exports = HedgeFollowScraper