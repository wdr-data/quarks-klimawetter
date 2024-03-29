<script>
    import Station from './Station.svelte';
    import StationSelect from './_partials/StationSelect.svelte';
    import TimeControls from './_partials/TimeControls.svelte';
    import { findNearestStation } from '$lib/findNearestStation';
    import { range as d3range } from 'd3-array';
    import dayjs from 'dayjs';
    import { onMount } from 'svelte';
    import Section from './_partials/Section.svelte';

    let stations;
    let station;

    let selected;

    let isLocalHost = false;

    const dataUrl = process.env.DATA_URL;
    // const dataUrl = 'https://data.wdr.de/quarks-klima-wetter/static/data';
    // const dataUrl = '/data';

    async function fetchJSON(url) {
        const res = await fetch(url, { mode: 'cors' });
        return res.json();
    }

    async function loadStations() {
        stations = await fetchJSON(`${dataUrl}/stations.json`);
        let match;
        if (location.hash) {
            const slug = location.hash.substr(2);
            match = stations.find(s => s.slug === slug);
            if (match) loadStation(match);
        }
        if (!location.hash || !match) {
            loadStation({ slug: 'berlin-tempelhof' });
            findNearestStation(stations, x => {
                loadStation(x);
            });
        }
        // listen to hash changes from here on
        window.addEventListener(
            'hashchange',
            function () {
                if (station && location.hash.substr(2) !== station.hash) {
                    loadStation({ slug: location.hash.substr(2) });
                }
            },
            false,
        );
        return stations;
    }

    onMount(() => {
        isLocalHost =
            location.hostname === 'localhost' || location.hostname === 'quarksklima.vis4.net';
    });

    function handleStationSelect(event) {
        loadStation(event.detail);
    }

    async function loadStation(s) {
        if (!s.id) {
            s = stations.find(d => d.slug === s.slug);
        }
        const [{ data, monthly }, { monthly: monthlyHist, daily }, fc] = await Promise.all([
            fetchJSON(`${dataUrl}/stations/weather/${s.id}.json`),
            fetchJSON(`${dataUrl}/stations/context/${s.id}.json`),
        ]);
        const lastDate = data[data.length - 1].date;
        s.data = data
            .concat(
                d3range(5).map(d => ({
                    date: dayjs(lastDate)
                        .add(d + 1, 'day')
                        .toDate(),
                })),
            )
            .map(d => {
                const day = dayjs(d.date).format('MM-DD');
                return {
                    ...d,
                    day,
                    date: new Date(d.date),
                    context: daily[day],
                };
            })
            .sort((a, b) => a.date - b.date);

        monthly.forEach(m => {
            // check if that month is already in monthlyStat
            if (monthlyHist[m.month - 1].stats.slice(-1)[0].year < m.year) {
                monthlyHist[m.month - 1].stats.push(m);
            }
        });
        s.monthlyStats = monthlyHist;
        s.prep = s.id === '05792' ? 'an der' : s.id === '00722' ? 'am' : 'in';
        station = s;
        selected = station.name;
        location.hash = `#/${station.slug}`;
    }
</script>

{#if isLocalHost}
    <TimeControls />
{/if}

<div>
    <Section wrapsSearchbox={true}>
        {#await loadStations()}
            <p>Loading stations</p>
        {:then stations}
            <StationSelect
                bind:active={selected}
                {stations}
                {dataUrl}
                on:select={handleStationSelect}
            />
        {/await}
    </Section>
    {#if station}
        <Station
            stationen={stations}
            {station}
            data={station.data}
            monthlyStats={station.monthlyStats}
        />
    {/if}
</div>
