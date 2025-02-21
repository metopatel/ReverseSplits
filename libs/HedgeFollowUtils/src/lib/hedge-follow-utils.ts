import axios from "axios";

const url = 'https://hedgefollow.com/ggg/web_request.php';
const ARRAYKEY = [12, 124, 43, 99];

function generateT() {
  const array = [...Array(3)].map(_ => Math.floor(Math.random() * 10000))
  const timestamp = Math.floor(Date.now() / 1000)
  const divisor = getRandomInt(11, 19)
  const power = Math.round(Math.random()) + 1;

  const token = getToken(array, timestamp, power, divisor);
  return {
    'arr': array,
    'ts': timestamp,
    'd': divisor,
    'p': power,
    'tk': token,
    'mts': Date.now()
  };
}

function getToken(array: number[], timestamp: number, power: number, divisor: number) {
  let computedResult = 0;
  for (let i = 0; i < array.length; i++)
    computedResult += ((-1) ** (power + i) * array[i]);
  return Math.floor((timestamp + computedResult) / divisor);
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function decodeResponse(str: string, k: number[]) {
  let enc = "";
  for (let i = 0; i < str.length; i++) {
    const a = str.charCodeAt(i);

    const b = a ^ k[i % 4];
    enc = enc + String.fromCharCode(b);
  }
  return enc;
}

export async function getStocks() {
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
    'id_params': generateT()
  }


  const response = await axios.post(url, data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const stockData = `[${decodeResponse(atob(response.data), ARRAYKEY).split(';')[0].split('= ')[1].split('],')[0].split(': [')[1]}]`;

  return JSON.parse(stockData);
}