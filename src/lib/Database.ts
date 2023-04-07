import mysql from 'mysql2/promise';
import { ExternalCalendar, User, Webhook } from '../types/DatabaseTypes';
import { encryptPassword } from '../util/Crypto';
import crypto from 'crypto';
import ActiefAPI from './ActiefAPI';

export default class Database {
    private _connection: mysql.Pool;
    private _api = new ActiefAPI();

    constructor() {
        this._connection = mysql.createPool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT!),
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });
        this.initialise();
    }

    private async initialise() {
        await this._connection.query('CREATE TABLE IF NOT EXISTS accounts ( `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `email` VARCHAR(255) NOT NULL, `password` VARCHAR(255) NOT NULL, `route` VARCHAR(255) NOT NULL)');
        await this._connection.query('CREATE TABLE IF NOT EXISTS externalCalendars ( `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `url` VARCHAR(255), `accountId` INT UNSIGNED NOT NULL, FOREIGN KEY (accountId) REFERENCES accounts(id) )')
        await this._connection.query('CREATE TABLE IF NOT EXISTS webhooks ( `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, `url` VARCHAR(255), `accountId` INT UNSIGNED NOT NULL, FOREIGN KEY (accountId) REFERENCES accounts(id) )')
    }

    public async getWebhookForUser(userId: number): Promise<Webhook> {
        const [rows] = await this._connection.query('SELECT * FROM webhooks WHERE accountId = ?', [userId]) as any;
        return rows[0] ?? undefined;
    }

    public async getAllExternalCalendars() {
        const [rows] = await this._connection.query('SELECT * FROM externalCalendars') as any;
        return rows as ExternalCalendar[];
    }

    public async getUserByRoute(id: string): Promise<User> {
        const [rows] = await this._connection.query('SELECT * FROM accounts WHERE route = ?', [id]) as any;
        return rows[0] ?? undefined;
    }

    public async getUserByEmail(email: string): Promise<User> {
        const [rows] = await this._connection.query('SELECT * FROM accounts WHERE email = ?', [email]) as any;
        return rows[0] ?? undefined;
    }

    public async getUserById(id: number): Promise<User> {
        const [rows] = await this._connection.query('SELECT * FROM accounts WHERE id = ?', [id]) as any;
        return rows[0] ?? undefined;
    }

    public async registerUser(email: string, password: string) {
        // Check if user already exists
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) return { error: true, code: 1 };

        // Check if the credentials provided are correct
        const cookies = await this._api.login(email, password);
        if (!cookies) {
            return { error: true, code: 2 };
        }

        const route = crypto.randomBytes(3).toString('hex');

        await this._connection.query('INSERT INTO accounts ( `email`, `password`, `route` ) VALUE ( ?, ?, ? )', [email, encryptPassword(password), route]);
        const newUser = await this.getUserByEmail(email);

        return { error: false, id: newUser.route };
    }
}