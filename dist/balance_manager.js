"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTable = createTable;
exports.get = get;
exports.getString = getString;
exports.set = set;
exports.setAll = setAll;
exports.add = add;
exports.addAll = addAll;
exports.remove = remove;
exports.removeAll = removeAll;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default('./balances.db');
function createTable(channelId) {
    db.prepare(`CREATE TABLE IF NOT EXISTS '${channelId}'(userId INT PRIMARY KEY, balance INT)`).run();
}
// figure out the typing for row and how to deal with that
function get(channelId, userId) {
    const row = db.prepare(`SELECT * FROM '${channelId}' WHERE userId = @user`).get({ user: userId });
    if (row == null) {
        let amt = 0;
        db.prepare(`INSERT INTO '${channelId}' (userId, balance) VALUES (@user, @amount)`).run({ user: userId, amount: amt });
        return amt;
    }
    else
        return row.balance;
}
function getString(channelId, userId) {
    return get(channelId, userId).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
function set(channelId, userId, balance) {
    db.prepare(`UPDATE '${channelId}' SET balance = @balance WHERE userId = @user`).run({ balance: balance, user: userId });
}
function setAll(channelId, balance) {
    db.prepare(`UPDATE '${channelId}' SET balance = @balance`).run({ balance: balance });
}
function add(channelId, userId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance + @amount WHERE userId = @user`).run({ amount: amount, user: userId });
}
function addAll(channelId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance + @amount`).run({ amount: amount });
}
function remove(channelId, userId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance - @amount WHERE userId = @user`).run({ amount: amount, user: userId });
}
function removeAll(channelId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance - @amount`).run({ amount: amount });
}
//# sourceMappingURL=balance_manager.js.map