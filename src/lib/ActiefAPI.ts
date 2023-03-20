import { load } from 'cheerio';
import { EventsResponse } from '../types/ActiefAPITypes';

export default class ActiefAPI {
    /**
     * Log into the actief website
     * @param username The username of the user to login with
     * @param password The password of the user to login with
     * @returns A promise that resolves to the session cookies
     */
    public async login(username: string, password: string): Promise<string | undefined> {
        const url = "https://login.actief.be/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fclient_id%3Dportal-client%26redirect_uri%3Dhttps%253A%252F%252Fportal.actief.be%252Fassets%252Fhtml%252Fsignin-callback.html%26response_type%3Dcode%26scope%3Dopenid%2520profile%2520core-api-client%26state%3Dd8e2a7cb527e41a2a8f63544ffc26d7e%26code_challenge%3DeDh9uXeKe9ux83XgiHL0siNj3w3e7cr3pEr8hz_tXkM%26code_challenge_method%3DS256%26response_mode%3Dquery";

        // Make initial fetch to get a request token
        const res = await fetch(url);

        const html = await res.text();
        const $ = load(html);
        const __RequestVerificationToken = $("input[name='__RequestVerificationToken']").val() as string;
        const cookies = res.headers.get("set-cookie");

        // Make a post request to login with the token and user credentials

        const params = new URLSearchParams();
        params.append("ReturnUrl", "/connect/authorize/callback?client_id=portal-client&redirect_uri=https%3A%2F%2Fportal.actief.be%2Fassets%2Fhtml%2Fsignin-callback.html&response_type=code&scope=openid%20profile%20core-api-client&state=d8e2a7cb527e41a2a8f63544ffc26d7e&code_challenge=eDh9uXeKe9ux83XgiHL0siNj3w3e7cr3pEr8hz_tXkM&code_challenge_method=S256&response_mode=query");
        params.append("Username", username);
        params.append("Password", password);
        params.append("button", "login");
        params.append("__RequestVerificationToken", __RequestVerificationToken);
        const res2 = await fetch(url, {
            method: "POST",
            body: params,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'cookie': cookies
            } as any,
            redirect: 'manual'
        });

        if (res2.status === 302) {
            return res2.headers.get("set-cookie") as string;
        }
        return undefined;
    }

    /**
     * 
     * @param cookies 
     */
    public async AuthorizeClient(cookies: string): Promise<{ code: string, state: string, session_state: string }> {
        const url = "https://login.actief.be/connect/authorize?client_id=portal-client&redirect_uri=https%3A%2F%2Fportal.actief.be%2Fassets%2Fhtml%2Fsilent-callback.html&response_type=code&scope=openid&state=021cec90c6734612a9672879e753abbd&code_challenge=UuhwUNldAiaawf8mbI9dZLJozI_AKiv7CinxxnbET1Q&code_challenge_method=S256&prompt=none&response_mode=query";
        const res = await fetch(url, {
            method: "GET",
            headers: {
                'cookie': cookies
            },
            redirect: 'manual'
        });

        const locationValue = res.headers.get("location") as string;
        const urlParams = new URLSearchParams(locationValue.split("?")[1]);

        // Fetch the location value as a callback
        await fetch(locationValue, {
            headers: {
                'cookie': cookies
            }
        });

        return {
            code: urlParams.get("code") as string,
            state: urlParams.get("state") as string,
            session_state: urlParams.get("session_state") as string
        }
    }

    /**
     * Get the access token
     * @param cookies The session cookies
     */
    public async getAccessToken(cookies: string, code: string): Promise<string> {
        const url = "https://login.actief.be/connect/token";

        const params = new URLSearchParams();
        params.append("client_id", "portal-client");
        params.append("grant_type", "authorization_code");
        params.append("redirect_uri", "https://portal.actief.be/assets/html/silent-callback.html");
        params.append("code_verifier", "6ec47285d9ce4f419a4536c8539b73868cfc2dd4463444a9a13fa8da9ead646d9aafce67944b44e393bd5701b92fdfbb");
        params.append("code", code)

        const res = await fetch(url, {
            method: "POST",
            body: params,
            headers: {
                'Origin': 'https://portal.actief.be',
                'Content-Type': 'application/x-www-form-urlencoded',
                'cookie': cookies
            }
        });

        const json = await res.json();
        return json.access_token;
    }

    public async getCurrentUser(token: string) {
        const url = "https://login.actief.be/connect/userinfo";
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const json = await res.json();
        console.log(json);
    }

    public async getCalenderEvents(cookies: string, token: string, from: Date, to: Date): Promise<EventsResponse> {
        const url = `https://core-client-api.actief.be/portal/v1/candidate/407044/calender-overview-events?from=${from.toString()}&until=${to.toString()}`;
        console.log(`Bearer ${token}`)
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'actiefportalurl': 'https://portal.actief.be/portal/candidate/calendar',
                'Host': 'core-client-api.actief.be',
                'Origin': 'https://portal.actief.be',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
                'cookie': cookies,
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(res.status);
        return await res.json();
    }
}