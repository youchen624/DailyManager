const path = require('path');
const rootPath = path.dirname(
    process.pkg ? process.execPath : require.main.filename
);
const fs = require('fs');
const LOGGER_PATH = path.join(rootPath, 'log');

class Logger {
    static raw(content) {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        fs.mkdir(
            LOGGER_PATH,
            { recursive: true },
            (err) => {
                // then
                fs.appendFile(
                    path.join(LOGGER_PATH, `${formattedDate}.log`),
                    `\n[${formattedTime}] ${content}`,
                    (err) => {
                        if (err) console.error(`[Error] Logger ${err}`);
                    }
                );
                console.log(`[${formattedTime}] ${content}`);
            }
        );
    }
    static log(msg) {
        Logger.raw(`[Log] ${msg}`);
    }
    static info(msg) {
        Logger.raw(`[Info] ${msg}`);
    }
    static warn(msg) {
        Logger.raw(`[Warn] ${msg}`);
    }
    static error(msg) {
        Logger.raw(`[Error] ${msg}`);
    }
    static l = Logger.log;
    static i = Logger.info;
    static w = Logger.warn;
    static e = Logger.error;
};

module.exports = Logger