import { UserIdResolvable } from "@twurple/api";
import Database from "better-sqlite3";
const db = new Database('./balances.db');

export function createTable(channelId: UserIdResolvable) {
    db.prepare(`CREATE TABLE IF NOT EXISTS '${channelId}'(userId INT PRIMARY KEY, balance INT)`).run();
}

// figure out the typing for row and how to deal with that
export function get(channelId: UserIdResolvable, userId: UserIdResolvable): number {
    const row: any = db.prepare(`SELECT * FROM '${channelId}' WHERE userId = @user`).get({ user: userId });
    if (row == null) {
        let amt: number = 0;
        db.prepare(`INSERT INTO '${channelId}' (userId, balance) VALUES (@user, @amount)`).run({ user: userId, amount: amt });
        return amt;
    } else return row.balance;
}

export function getString(channelId: UserIdResolvable, userId: UserIdResolvable): string {
    return get(channelId, userId).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

export function set(channelId: UserIdResolvable, userId: UserIdResolvable, balance: number) {
    db.prepare(`UPDATE '${channelId}' SET balance = @balance WHERE userId = @user`).run({ balance: balance, user: userId });
}

export function setAll(channelId: UserIdResolvable, balance: number) {
    db.prepare(`UPDATE '${channelId}' SET balance = @balance`).run({ balance: balance });
}

export function add(channelId: UserIdResolvable, userId: UserIdResolvable, amount: number) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance + @amount WHERE userId = @user`).run({ amount: amount, user: userId });
}

export function addAll(channelId: UserIdResolvable, amount: number) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance + @amount`).run({ amount: amount });
}

export function remove(channelId: UserIdResolvable, userId: UserIdResolvable, amount: number) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance - @amount WHERE userId = @user`).run({ amount: amount, user: userId });
}

export function removeAll(channelId: UserIdResolvable, amount: number) {
    db.prepare(`UPDATE '${channelId}' SET balance = balance - @amount`).run({ amount: amount });
}