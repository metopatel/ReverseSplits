import * as mysql from 'mysql2/promise';

export class MySQLClient {
	
	constructor() {
		return;	
	}
	
	Connection = mysql.createConnection({
		host: process.env.MYSQL_HOST,
		port: parseInt(process.env.MYSQL_PORT ?? '5567'),
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASS,
		database: process.env.MYSQL_DB
	});
}