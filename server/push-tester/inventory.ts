import {DatabaseSync} from "node:sqlite";

export type InventoryToken = {serial: string; description: string; expiresAt: number};

export function openInventory(path: string) {
    const database = new DatabaseSync(path);
    database.exec(`
        PRAGMA busy_timeout = 5000;
        CREATE TABLE IF NOT EXISTS tokens (
            serial TEXT PRIMARY KEY,
            description TEXT NOT NULL,
            expiresAt INTEGER NOT NULL,
            retryAt INTEGER NOT NULL DEFAULT 0
        ) STRICT;
    `);

    const importToken = database.prepare(
        "INSERT OR IGNORE INTO tokens (serial, description, expiresAt) VALUES (?, ?, ?)",
    );
    const reserve = database.prepare(`
        INSERT INTO tokens (serial, description, expiresAt)
        SELECT ?, ?, ?
        WHERE (SELECT COUNT(*) FROM tokens) < ?
          AND (SELECT COUNT(*) FROM tokens WHERE description = ?) < 3
    `);
    const find = database.prepare("SELECT expiresAt FROM tokens WHERE serial = ? AND description = ?");
    const expired = database.prepare(
        "SELECT serial, description, expiresAt FROM tokens WHERE expiresAt <= ? AND retryAt <= ? ORDER BY expiresAt LIMIT 10",
    );
    const remove = database.prepare("DELETE FROM tokens WHERE serial = ? AND description = ?");
    const retry = database.prepare("UPDATE tokens SET retryAt = ? WHERE serial = ? AND description = ?");

    return {
        importToken(token: InventoryToken) {
            importToken.run(token.serial, token.description, token.expiresAt);
        },
        reserve(token: InventoryToken, capacity: number) {
            return (
                reserve.run(token.serial, token.description, token.expiresAt, capacity, token.description).changes === 1
            );
        },
        isActive(serial: string, description: string, now: number) {
            const entry = find.get(serial, description);
            return typeof entry?.expiresAt === "number" && entry.expiresAt > now;
        },
        expired(now: number) {
            return expired.all(now, now) as InventoryToken[];
        },
        remove(serial: string, description: string) {
            remove.run(serial, description);
        },
        retry(token: InventoryToken, at: number) {
            retry.run(at, token.serial, token.description);
        },
    };
}
