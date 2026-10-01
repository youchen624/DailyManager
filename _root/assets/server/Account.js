/**
 * @name Account class
 * @author youchen624
 * @date Created at 2025 03/16
 * @description
 * account save at /data/accounts/<accountName>/lock.json
 */

const path = require('path');
const rootPath = path.dirname(
    process.pkg ? process.execPath : require.main.filename
);
const Logger = require(path.join(rootPath, 'assets/server/logger'));
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fs = require('fs').promises;
const SECRET_KEY = process.env.JWT_SECRET;
// console.log('authPath:', rootPath);
const ACCOUNTS_PATH = path.join(rootPath, "data/accounts");
const ACTIVECODES_PATH = path.join(ACCOUNTS_PATH, "activeCodes.json")

class Account {
    accountId;
    roles;
    constructor(token) {
        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            // const data = JSON.stringify(decoded);
            // console.log(`Data: ${data}`);
            this.accountId = decoded.accountId;
            this.roles = new Set(decoded.role || []);
        } catch (e) { this.accountId = null; }
    };
    static auth(token) {
        // console.log(`Authing: ${token}`);
        return new Account(token);
        /*
        try {
            jwt.verify(token, SECRET_KEY);
            return new Account(token);
        } catch (e) {
            return new Account(token);
        }
        */
    };
    async roleAction(needRoles, callback, eCallback, finallyCallback) {
        needRoles = new Set(Array.isArray(needRoles) ? needRoles : [needRoles]);
        const hasRoles = [...this.roles].every(v => needRoles.has(v));
        try {
            if (!hasRoles) throw new Error("No permissions.");
            callback?.(this.accountId);
        }
        catch (e) { eCallback?.(this.accountId, e); }
        finally { finallyCallback?.(this.accountId); }
    }
    async action(callback, eCallback, finallyCallback) {
        try {
            if (!this.accountId) throw new Error("No Auth.");
            callback(this.accountId);
        }
        catch (e) { eCallback?.(this.accountId, e); }
        finally { finallyCallback?.(this.accountId); }
    };
    static async login(account, password, exp = '1w') {
        try {
            const accountId = account
                .replace(/[A-Z]/g, char => char.toLowerCase())
                .replace(/[^a-z0-9_]/g, "");
            if (!accountId) throw new Error("Invalid account.");
            const accountPath = path.join(ACCOUNTS_PATH, accountId, 'lock.json');
            await fs.access(accountPath);
            const data = JSON.parse(await fs.readFile(accountPath, 'utf-8'));
            // console.log('檔案內容：', data);
            if (data.password === password) {
                Logger.info(`'${accountId}'成功登入`);
                const token = jwt.sign({ accountId }, SECRET_KEY, { expiresIn: exp });
                return token;
            } else {
                console.error('some errors');
            }
        } catch (e) {
            console.error(`[Error] Login Error: ${e}`);
        }
    };
    static async create(activeCode, account, password, callback, eCallback) {
        try {
            account = account?.replace(/[A-Z]/g, char => char.toLowerCase());
            const errorA = account?.replace(/[a-z0-9_]/g, "");
            if (errorA) throw new Error("Only a~z, 0~9, _");
            if (account === 'default') throw new Error("Invalid Account.");
            if (!password) throw new Error("A password is required.");
            await fs.access(ACTIVECODES_PATH).catch((e) => {
                Logger.error("❌ACTIVECODES_PATH error");
                throw new Error('Server error');
            });
            const data = JSON.parse(await fs.readFile(ACTIVECODES_PATH, 'utf-8'));
            const codes = data.activeCodes || [];
            if (!codes.includes(activeCode)) throw new Error("Invalid active code.");
            const now = new Date();
            const accountPath = path.join(ACCOUNTS_PATH, account, "lock.json");
            const content = {
                "name": account,
                "password": password,
                "date": {
                    "created": now.getTime()
                }
            };
            await fs.mkdir(path.join(ACCOUNTS_PATH, account), { recursive: true });
            await fs.writeFile(accountPath, JSON.stringify(content, null, 4), { flag: 'wx', encoding: 'utf-8' });
            const newCodes = codes.filter(ele => ele !== activeCode);
            const newData = JSON.stringify({ activeCodes: newCodes }, null, 4);
            fs.writeFile(ACTIVECODES_PATH, newData, { encoding: 'utf-8' });
            Logger.info(`Created Account '${account}' by used active-code '${activeCode}'`);
            callback?.(await Account.login(account, password, '4w'));
        } catch (err) {
            if (err.code === 'EEXIST') {
                eCallback?.(new Error("Account already exists."));
            } else {
                eCallback?.(err);
            }
        }
    };
    async delete() { };
    async edit() { };
    async test() {
        console.log('test done');
    };
};

module.exports = Account