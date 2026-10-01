const express = require('express');
const path = require('path');
const rootPath = process.pkg ? path.dirname(process.execPath) : __dirname;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const fs = require('fs').promises;

const Logger = require(path.join(rootPath, 'assets/server/logger'));
const Account = require(path.join(rootPath, 'assets/server/Account'));
require('dotenv').config();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET;
// console.log('mainPath:', rootPath);
// console.log('cwd:', process.cwd());
/*
const encryptedToken = jwt.sign(payload, 'private_key', { algorithm: 'HS256', encrypt: true });
*/
app.use(cors({ credentials: true }));
// 允許 JSON 格式的請求
app.use(express.json());
// app.use(express.static(path.join(rootPath, 'assets')));
app.use('/assets', express.static(path.join(rootPath, 'assets')));
app.use(cookieParser());
// app.use(express.static('public'));
// 設定靜態文件夾，將 public 目錄中的文件作為靜態文件

app.post('/api/data/save', (req, res) => {
    /*
    {
        timestamp: timestamp,
        data: {
            mood: <string>,
            title: <string>,
            note: <string>
        }
    }
    */
    const token = req.cookies.token;
    const { timestamp, data } = req.body;
    const date = new Date(timestamp);
    const time = {
        y: String(date.getFullYear()),
        m: String(date.getMonth() + 1).padStart(2, '0'),
        d: String(date.getDate()).padStart(2, '0'),
    };
    Account.auth(token).action((account) => {
        const dataDir = path.join(
            rootPath, 'data/accounts', account, 'data', time.y, time.m
        );
        const dataPath = path.join(dataDir, `${time.d}.json`);
        fs.mkdir(dataDir, { recursive: true })
            .then(()=>{
                fs.writeFile(dataPath, JSON.stringify(data, null, 4), 'utf-8')
            })
            .then(()=>{
                res.json({ message: "Save Data成功", user: account });
            })
            .catch(err=>res.status(500).json({ error: err.message }));
        Logger.info(`'${account}' saved data at ${time.y}/${time.m}/${time.d}.json`);
    }, (accountId) => {
        console.error(e);
        console.log(`t: ${accountId}`);
        res.status(401).json({ message: '無效授權', error: 'error' });
    });
});
app.post('/api/data/read', (req, res) => {
    /* { timestamp: timestamp } */
    const token = req.cookies.token;
    const { timestamp } = req.body;
    const date = new Date(timestamp);
    const time = {
        y: String(date.getFullYear()),
        m: String(date.getMonth() + 1).padStart(2, '0'),
        d: String(date.getDate()).padStart(2, '0'),
    };
    Account.auth(token).action((account) => {
        const dataDir = path.join(
            rootPath, 'data/accounts', account, 'data', time.y, time.m
        );
        const dataPath = path.join(dataDir, `${time.d}.json`);
        fs.readFile(dataPath, 'utf-8')
        .then((content)=>{
            res.json(JSON.parse(content));
        })
        .catch((e)=> {
            if (e.code === 'ENOENT') {
                res.json({});
            }else Logger.error(e);
        });
        /*
        fs.mkdir(dataDir, { recursive: true })
        .then(()=>{
            fs.writeFile(dataPath, JSON.stringify(data, null, 4), 'utf-8')
        })
        .then(()=>{
            res.json({ message: "Save Data成功", user: account });
        })
        .catch(err=>res.status(500).json({ error: err.message }));
        */
    }, (accountId) => {
        console.error(e);
        console.log(`t: ${accountId}`);
        res.status(401).json({ message: '無效授權', error: 'error' });
    });
});

app.post('/api/login', (req, res) => {
    const { account, password } = req.body;

    Account.login(account, password, '1w').then((token) => {
        if (!token) {
            return res.status(401).json({ message: "帳號或密碼錯誤", isLogin: false });
        }
        // 設定 HttpOnly Cookie
        // console.log(`Login Token: `, token);
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.json({ message: "登入成功", isLogin: true });
    });
});

app.post('/api/register', (req, res) => {
    const { activeCode, account, password } = req.body;

    Account.create(activeCode, account, password, (token) => {
        if (!token) {
            return res.status(401).json({ message: "帳號或密碼錯誤", isLogin: false });
        }
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });
        res.json({ message: "登入成功", isLogin: true });
    }, (e) => {
        console.error(e);
        res.json({ message: e.message, isLogin: false });
    });
});

app.get('/api/profile', (req, res) => {
    const token = req.cookies.token;
    // console.log(`Profile Token: `, token? '✅':'❌');
    Account.auth(token).action((account) => {
        console.log(account);
        res.json({ message: "驗證成功", user: account });
    }, () => {
        res.status(401).json({ message: '無效授權', error: 'error' });//error.message
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "登出成功" });
});

// #首頁
app.get('/', (req, res) => {
    res.sendFile(path.join(rootPath, 'assets', 'web', 'index.html'));
});
// #登入頁面
app.get('/login', (req, res) => {
    res.sendFile(path.join(rootPath, 'assets', 'web', 'login.html'));
});
// #註冊頁面
app.get('/register', (req, res) => {
    res.sendFile(path.join(rootPath, 'assets', 'web', 'register.html'));
});

app.get('/api/proxy-image', (req, res) => {
    const token = req.cookies.token;
    let imagePath;
    Account.auth(token).action((a) => {
        imagePath = path.join(rootPath, 'data/accounts/', a, '/icon.png');
    }, (e) => { });
    if (!imagePath)
        imagePath = path.join(rootPath, 'data/accounts/default/icon.png');
    res.sendFile(imagePath);
});
app.get('/api/check-token', (req, res) => {
    const token = req.cookies.token;
    Account.auth(token).action((a) => {
        // console.log('return true');
        res.json({ isLogin: true });
    }, () => {
        // console.log('return false');
        res.json({ isLogin: false });
    });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on Port: ${PORT}`));
