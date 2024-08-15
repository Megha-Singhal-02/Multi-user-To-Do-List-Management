const mysql = require('mysql');

const connection = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "todolist",
	port: 3307
});

connection.connect((error) => {
	if (error) {
		console.log("Error: " + error);
	}
	else {
		// console.log("Connection Set up Finally");
	}
});

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

module.exports = connection;