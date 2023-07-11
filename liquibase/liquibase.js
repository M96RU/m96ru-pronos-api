const Liquibase = require('node-liquibase').Liquibase;
const POSTGRESQL_DEFAULT_CONFIG = require('node-liquibase').POSTGRESQL_DEFAULT_CONFIG;

async function liquibase() {

    const url = 'jdbc:postgresql://' + process.env.db_host + ':' + process.env.db_port + '/' + process.env.db_schema;

    const myConfig = {
        ...POSTGRESQL_DEFAULT_CONFIG,
        changeLogFile: 'liquibase/changelog.xml',
        url: url,
        username: process.env.db_user,
        password: process.env.db_pwd
    }
    const instTs = new Liquibase(myConfig);

    await instTs.update();

    await instTs.status();
}

liquibase()
    .then(_ => console.log('done'))
    .catch(e => console.error(e));
