/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    console.log(`[DEBUG] Incoming Request: ${event.request.method} ${event.url.href}`);
    console.log(`[DEBUG] URL Object:`, event.url);

    const response = await resolve(event);
    return response;
}
