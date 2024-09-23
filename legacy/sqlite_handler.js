import Database from "better-sqlite3";
const db = new Database('./balances.db');

export function initialize(channelId) {
    db.prepare(`CREATE TABLE IF NOT EXISTS '${channelId}'(userId INT PRIMARY KEY, balance INT)`).run();
}

export function getBalance(channelId, userId, str = false) {
    const row = db.prepare(`SELECT * FROM '${channelId}' WHERE userId = ${userId}`).get();
    if (row == null) {
        var amt = 3000;
        db.prepare(`INSERT INTO '${channelId}' (userId, balance) VALUES (${userId}, ${amt})`).run();
        return !str ? amt : amt.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    } else {
        return !str ? row.balance : row.balance.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    }
}

export function setBalance(channelId, userId, balance) {
    db.prepare(`UPDATE '${channelId}' SET balance = ${balance} WHERE userId = ${userId}`).run();
    return;
}

export function setBalanceAll(channelId, balance) {
    db.prepare(`UPDATE '${channelId}' SET balance = ${balance}`).run();
    return;
}

export function addBalance(channelId, userId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance + ${amount} WHERE userId = ${userId}`).run();
}

export function addBalanceAll(channelId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance + ${amount}`).run();
}

export function removeBalance(channelId, userId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance - ${amount} WHERE userId = ${userId}`).run();
}

export function removeBalanceAll(channelId, amount) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance - ${amount}`).run();
}