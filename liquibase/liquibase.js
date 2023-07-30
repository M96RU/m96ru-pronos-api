const path = require("path");
const fs = require("fs");

const Client = require('pg').Client;

const client = new Client({
    host: process.env.db_host,
    port: process.env.db_port,
    database: process.env.db_schema,
    user: process.env.db_user,
    password: process.env.db_pwd,
});



async function liquibase() {

    console.log('liquibase() begins...');

    await client.connect();

    const checkChangeLogTable = `SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_NAME='db_changelog'`;
    const res = await client.query(checkChangeLogTable);
    if (res.rows.length === 0) {
        console.log('Init db_changelog');
        const createTable = 'CREATE TABLE "db_changelog" ("filename" VARCHAR(255) NOT NULL,\t"dateexecuted" TIMESTAMPTZ NOT NULL)';
        await client.query(createTable);
    }

    const path = require('path');
    const fs = require('fs');

    const directoryPath = path.join(__dirname, 'changelogs');

    const files = fs.readdirSync(directoryPath)
    for (index in files) {
        const filename = files[index];
        const checkChangeLog = `SELECT * FROM db_changelog WHERE filename='${filename}'`;
        const checkChangeLogFound = await client.query(checkChangeLog);

        if (checkChangeLogFound.rows.length === 0) {
            console.log(`execute filename ${filename}...`);
            const filepath = path.join(directoryPath, filename);
            const data = fs.readFileSync(filepath, 'utf8');
            await client.query(data);

            const text = 'INSERT INTO db_changelog(filename, dateexecuted) VALUES($1, $2) RETURNING *';
            const values = [filename, new Date()];
            await client.query(text, values);

            console.log(`execute filename ${filename} ok`);
        }
    }

    await client.end();
    console.log('liquibase() done !');

}

module.exports = {
    run: liquibase
}
// try {
//     liquibase()
// } catch (e) {
//     console.log(e);
// }

