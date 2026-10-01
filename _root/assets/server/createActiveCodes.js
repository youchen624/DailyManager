const crypto = require("crypto");
const nums = 8;
let codes = [];
for(let i = 0; i < nums; i++) {
    codes.push(crypto.randomBytes(8).toString("hex"));
}
console.log(JSON.stringify(codes, null, 4));
