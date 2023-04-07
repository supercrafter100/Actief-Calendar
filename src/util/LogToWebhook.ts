export default async function logToDiscordWebhook(url: string, content: string, color: string = '#313338') {
    const data = {
        embeds: [
            {
                description: content,
                color: parseInt(color.replace('#', ''), 16)
            }
        ]
    }

    await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json'
        }
    })
}