import * as cheerio from 'cheerio';

export async function load() {
    try {
        const response = await fetch('https://www.dataroma.com/m/rt.php');
        const html = await response.text();
        const $ = cheerio.load(html);

        const transactions = [];

        $('#grid tbody tr').each((i, el) => {
            const date = $(el).find('td:nth-child(1)').text().trim();
            const investor = $(el).find('td:nth-child(3)').text().trim();
            const activity = $(el).find('td:nth-child(4)').text().trim();
            const stock = $(el).find('td:nth-child(5)').text().trim();
            const price = $(el).find('td:nth-child(7)').text().trim();
            const total = $(el).find('td:nth-child(8)').text().trim();

            if (stock && activity) {
                transactions.push({
                    date,
                    investor,
                    activity,
                    stock,
                    price,
                    total
                });
            }
        });

        return {
            transactions
        };
    } catch (error) {
        console.error('Error scraping DataRoma:', error);
        return {
            transactions: []
        };
    }
}
