<script>
    import { onMount, onDestroy } from "svelte";
    import WidgetContainer from "$lib/components/WidgetContainer.svelte";
    import { invalidateAll } from "$app/navigation";

    export let data; // Receive server data

    let cryptoData = [];
    let cryptoInterval;
    let dataromaInterval;

    async function fetchCrypto() {
        try {
            const res = await fetch(
                "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d",
            );
            const data = await res.json();
            cryptoData = data;
        } catch (e) {
            console.error("Failed to fetch crypto prices", e);
        }
    }

    onMount(async () => {
        // Initial Fetch
        fetchCrypto();

        // Crypto Refresh (3s)
        cryptoInterval = setInterval(fetchCrypto, 3000);

        // DataRoma Refresh (5m)
        dataromaInterval = setInterval(() => {
            console.log("Refreshing DataRoma data...");
            invalidateAll();
        }, 300000);
    });

    onDestroy(() => {
        clearInterval(cryptoInterval);
        clearInterval(dataromaInterval);
    });

    const user = {
        name: "User", // This could come from auth store if we wanted
    };

    function formatPct(val) {
        if (typeof val === "number") return `${val.toFixed(2)}%`;
        return "-";
    }

    function getColorClass(val) {
        if (val > 0) return "text-green-500";
        if (val < 0) return "text-red-500";
        return "text-gray-500";
    }
</script>

<h1>Welcome Home, {user.name}!</h1>

<p>This is your personalized dashboard.</p>

<div class="widgets-grid">
    <WidgetContainer title="Crypto Prices">
        <div class="crypto-list">
            {#if cryptoData.length > 0}
                {#each cryptoData as coin}
                    <div class="crypto-item">
                        <div class="coin-header">
                            <span class="coin-name"
                                >{coin.name} ({coin.symbol.toUpperCase()})</span
                            >
                            <span class="price"
                                >${coin.current_price.toLocaleString()}</span
                            >
                        </div>
                        <div class="coin-stats">
                            <div class="stat">
                                <span class="label">24h:</span>
                                <span
                                    class={getColorClass(
                                        coin.price_change_percentage_24h_in_currency,
                                    )}
                                >
                                    {formatPct(
                                        coin.price_change_percentage_24h_in_currency,
                                    )}
                                </span>
                            </div>
                            <div class="stat">
                                <span class="label">7d:</span>
                                <span
                                    class={getColorClass(
                                        coin.price_change_percentage_7d_in_currency,
                                    )}
                                >
                                    {formatPct(
                                        coin.price_change_percentage_7d_in_currency,
                                    )}
                                </span>
                            </div>
                            <div class="stat">
                                <span class="label">30d:</span>
                                <span
                                    class={getColorClass(
                                        coin.price_change_percentage_30d_in_currency,
                                    )}
                                >
                                    {formatPct(
                                        coin.price_change_percentage_30d_in_currency,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                {/each}
            {:else}
                <p>Loading crypto data...</p>
            {/if}
        </div>
    </WidgetContainer>

    <div class="superinvestor-widget">
        <WidgetContainer title="Superinvestor Activity">
            <div class="scrollable-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Investor</th>
                            <th>Stock</th>
                            <th>Action</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#if data?.transactions?.length > 0}
                            {#each data.transactions as tx}
                                <tr>
                                    <td>{tx.date}</td>
                                    <td>{tx.investor}</td>
                                    <td>{tx.stock}</td>
                                    <td
                                        class:buy={tx.activity === "Buy"}
                                        class:sell={tx.activity === "Sell"}
                                        >{tx.activity}</td
                                    >
                                    <td>{tx.price}</td>
                                </tr>
                            {/each}
                        {:else}
                            <tr>
                                <td
                                    colspan="5"
                                    style="text-align:center; padding: 1rem;"
                                    >No data available or loading...</td
                                >
                            </tr>
                        {/if}
                    </tbody>
                </table>
            </div>
        </WidgetContainer>
    </div>
</div>

<style>
    h1 {
        font-size: 2rem;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    p {
        color: #6b7280;
        margin-bottom: 2rem;
    }

    .widgets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
        align-items: start;
    }

    .superinvestor-widget {
        grid-column: span 2;
    }

    @media (max-width: 1000px) {
        .superinvestor-widget {
            grid-column: span 1;
        }
    }

    .crypto-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .crypto-item {
        display: flex;
        flex-direction: column;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .crypto-item:last-child {
        border-bottom: none;
    }

    .coin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
    }

    .coin-name {
        font-weight: 500;
        color: #374151;
    }

    .price {
        font-weight: 600;
        color: #111827;
        font-size: 1.1rem;
    }

    .coin-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
    }

    .stat {
        display: flex;
        gap: 0.25rem;
    }

    .label {
        color: #6b7280;
    }

    .text-green-500 {
        color: #10b981;
    }
    .text-red-500 {
        color: #ef4444;
    }
    .text-gray-500 {
        color: #6b7280;
    }

    /* Table Styles */
    .scrollable-table {
        overflow-y: auto;
        max-height: 500px; /* Fixed height for scrolling */
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
    }

    th {
        position: sticky;
        top: 0;
        text-align: left;
        padding: 0.75rem;
        background-color: #f9fafb;
        color: #6b7280;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
        z-index: 10;
    }

    td {
        padding: 0.75rem;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
    }

    td.buy {
        color: #16a34a;
        font-weight: 500;
    }

    td.sell {
        color: #dc2626;
        font-weight: 500;
    }
</style>
