const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: 3306,
	connectTimeout: 20000
});

connection.connect((error) => {
	if (error) {
		console.log("Error: " + error);
	}
	else {
		// console.log("Connection Set up Finally");
	}
});

const sessionStore = new MySQLStore({},connection)

connection.query("Select * from users", (error, result) => {
	if (error) {
		console.error("Error: ", error);
	}
})

connection.query("Select * from todo_lists", (error, result) => {
	if (error) {
		console.log("Error: " + error)
	}
})

module.exports = {connection, sessionStore};