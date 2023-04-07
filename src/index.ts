import express from 'express';
import CalendarManager from './lib/CalendarManager';
import { config } from 'dotenv';
import Database from './lib/Database';
import { decryptPassword } from './util/Crypto';
import AvailabilitiesManager from './lib/AvailabilitiesManager';

config();
const REFRESH_RATE = 1000 * 60 * 10 // 10 minutes
const database = new Database();

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    const user = await database.registerUser(email, password);
    return res.json(user)
})

app.all('/calendar/:id', async (req, res) => {
    const userIdentifier = req.params.id;
    const userRecord = await database.getUserByRoute(userIdentifier);

    if (!userRecord) {
        return res.status(404).send("Not found");
    }

    const username = userRecord.email;
    const password = decryptPassword(userRecord.password);

    const calendar = await CalendarManager.GetCalendar(userIdentifier, username, password, database);
    calendar?.calendar.serve(res);
})

app.listen(process.env.SERVER_PORT || 5000, () => {
    console.log("ready");
});

const availabilitiesManager = new AvailabilitiesManager(database);

setInterval(CalendarManager.RefreshCalendars, REFRESH_RATE);
setInterval(() => availabilitiesManager.refreshAvailabilities(), REFRESH_RATE);

// Try to catch errors and stop the process from crashing
process.on('uncaughtException', (err) => console.log(err));
process.on('unhandledRejection', (err) => console.log(err));