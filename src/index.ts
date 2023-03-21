import express from 'express';
import CalendarManager from './lib/CalendarManager';

const REFRESH_RATE = 1000 * 60 * 10 // 10 minutes

const registeredUsers = {
    'aaaaaaa': {
        username: '',
        password: ''
    }
} as any

const app = express();
app.all('/:id', async (req, res) => {
    const userIdentifier = req.params.id;

    if (!registeredUsers[userIdentifier]) {
        return res.status(404).send("Not found");
    }

    const calendar = await CalendarManager.GetCalendar(userIdentifier, registeredUsers[userIdentifier].username, registeredUsers[userIdentifier].password);
    calendar?.calendar.serve(res);
})

app.listen(process.env.PORT || 5000, () => {
    console.log("ready");
});

setInterval(CalendarManager.RefreshCalendars, REFRESH_RATE);