const got = require('got');
const slugify = require('slugify');
const dayjs = require('dayjs');

const STATION_BLACKLIST = [
    'Hameln',
    'Flensburg (Schäferhaus)',
    'Düsseldorf',
    'Hornisgrinde',
    'Bochum',
    'Greifswalder Oie',
    'Harzburg, Bad',
    'Bertsdorf-Hörnitz',
    'Köthen (Anhalt)',
    'Lenzkirch-Ruhbühl',
    'Sondershausen',
];

module.exports = async function loadStations (baseMinYear) {
    const url =
        'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl/recent/KL_Tageswerte_Beschreibung_Stationen.txt';
    const raw = (await got(url, { encoding: 'latin1' })).body;
    const stations = parseFixedWidth(raw, {
        // The format was changed sometime between 2024-04-15 and 2024-05-01
        // ...and changed back again.
        //widths: [21, 9, 9, 14, 12, 10, 81, 843],
        skip: 2,
        widths: [5, 9, 9, 15, 12, 10, 42, 22],
        names: ['id', 'from', 'to', 'altitude', 'lat', 'lon', 'name', 'state'],
    })
        .map(station => ({
            ...station,
            from: dayjs(station.from).format('YYYY-MM-DD'),
            to: dayjs(station.to).format('YYYY-MM-DD'),
            slug: slugify(station.name, { lower: true, locale: 'de', remove: /[()\/]/ }),
            altitude: +station.altitude,
            lat: +station.lat,
            lon: +station.lon,
        }))
        .filter(station => !STATION_BLACKLIST.includes(station.name))
        .filter(d => dayjs(d.from).year() <= baseMinYear && dayjs().diff(d.to, 'day') < 5)
        .sort((a, b) => (a.slug > b.slug ? 1 : b.slug > a.slug ? -1 : 0));

    if (stations.length === 0) {
        throw new Error('No stations found');
    }
    return stations;
};

function parseFixedWidth (data, { skip = 0, widths = [], names = [], trim = true }) {
    const rows = data.split('\n').slice(skip);
    return rows.map(row => {
        const d = {};
        let offset = 0;
        widths.forEach((w, i) => {
            d[names[i]] = row.substr(offset, w);
            offset += w;
            if (trim) d[names[i]] = d[names[i]].trim();
        });
        return d;
    });
}
