import ActiefAPI from "./lib/ActiefAPI";
import dotenv from 'dotenv';
dotenv.config();

(async () => {

    if (!process.env.USERNAME || !process.env.PASSWORD) {
        console.log("Please set the USERNAME and PASSWORD environment variables");
        return;
    }

    const api = new ActiefAPI();
    const cookies = await api.login(process.env.USERNAME, process.env.PASSWORD);

    if (!cookies) {
        console.error("Failed to login");
        return;
    }

    const { code } = await api.AuthorizeClient(cookies);
    const token = await api.getAccessToken(cookies, code);

    await api.getCurrentUser(token);

    const now = new Date();
    const then = new Date();
    now.setMonth(now.getMonth() - 1);
    then.setMonth(then.getMonth() + 1);

    const json = await api.getCalenderEvents(cookies, token, now, then);
    console.log(json);
})();
