<script>
    import { fmtTemp, fmtRain } from '$lib/formats';
    import dayjs from 'dayjs';

    export let station;
    export let curDay;

    $: isToday = curDay.day === dayjs().format('MM-DD');

    $: tempSentence =
        curDay.TXK > curDay.context.TXK_hi
            ? 'überdurchschnittlich warm'
            : curDay.TXK < curDay.context.TXK_lo
            ? 'überdurchschnittlich kalt'
            : 'durchschnittlich warm';

    $: tempRecord =
        curDay.TXK > curDay.context.TXK_records.hi[2].TXK
            ? `Das ist ${fmtTemp(
                  curDay.TXK - curDay.context.TXK_records.hi[2].TXK,
              )} <b>heißer als der bisherige Hitzerekord</b> von ${fmtTemp(
                  curDay.context.TXK_records.hi[2].TXK,
              )} im Jahr ${curDay.context.TXK_records.hi[2].year}.`
            : curDay.TXK === curDay.context.TXK_records.hi[2].TXK
            ? `Das ist <b>genauso heiß wie der bisherige Hitzerekord</b> von ${curDay.context.TXK_records.hi[2].year}.`
            : curDay.TXK > curDay.context.TXK_records.hi[1].TXK
            ? `Das ist <b>die zweithöchste Temperatur</b>, die hier je gemessen wurde (der Rekord von ${
                  curDay.context.TXK_records.hi[2].year
              } liegt bei ${fmtTemp(curDay.context.TXK_records.hi[2].TXK)}).`
            : curDay.TXK > curDay.context.TXK_records.hi[0].TXK
            ? `Das ist <b>die dritthöchste Temperatur</b>, die hier je gemessen wurde (nach ${fmtTemp(
                  curDay.context.TXK_records.hi[2].TXK,
              )} im Jahr ${curDay.context.TXK_records.hi[2].year} und ${fmtTemp(
                  curDay.context.TXK_records.hi[1].TXK,
              )} im Jahr ${curDay.context.TXK_records.hi[1].year}).`
            : curDay.TXK < curDay.context.TXK_records.lo[0].TXK
            ? `Das ist ${fmtTemp(
                  curDay.context.TXK_records.lo[0].TXK - curDay.TXK,
              )} <b>kälter als der bisherige Kälterekord</b> von ${fmtTemp(
                  curDay.context.TXK_records.lo[0].TXK,
              )} im Jahr ${curDay.context.TXK_records.lo[0].year}.`
            : false;

    $: precipLabel = curDay.snow30days ? 'geregnet oder geschneit' : 'geregnet';

    $: precipSentence =
        curDay.rain30days > curDay.context.rain30days_hi
            ? `überdurchschnittlich viel ${precipLabel}`
            : curDay.rain30days < curDay.context.rain30days_lo
            ? `überdurchschnittlich wenig ${precipLabel}`
            : `durchschnittlich viel ${precipLabel}`;

    $: tempClass =
        curDay.TXK > curDay.context.TXK_hi
            ? 'high'
            : curDay.TXK < curDay.context.TXK_lo
            ? 'low'
            : 'normal';

    $: precipClass =
        curDay.rain30days > curDay.context.rain30days_hi
            ? 'high'
            : curDay.rain30days < curDay.context.rain30days_lo
            ? 'low'
            : 'normal';

    export let copySentence;

    $: {
        copySentence =
            tempClass === 'normal'
                ? `Mit ${fmtTemp(curDay.TXK)} ist es heute normal warm.`
                : `Mit ${fmtTemp(curDay.TXK)} ist es heute ${station.prep} ${
                      station.name
                  } ${tempSentence}. Im Vergleich zum Referenzzeitraum ist es heute also ${`etwa ${fmtTemp(
                      Math.round(
                          curDay.TXK -
                              (tempClass === 'high'
                                  ? curDay.context.TXK_hi
                                  : curDay.context.TXK_lo),
                      ),
                  )} ${curDay.TXK > curDay.context.TXK ? 'wärmer' : 'kälter'}`}.`;
    }
</script>

<div class="topinfo">
    <div>
        <div class="flx">
            <div style="margin-bottom:10px">
                <strong>{station.name}, {dayjs(curDay.date).format('LL')}</strong>
            </div>
            <div class="flex" style="margin-bottom:10px">
                <div><i class="g-icon">🌡️</i></div>
                <div>
                    {isToday ? 'Heute ist es' : 'Es war'} mit max.
                    <span>{fmtTemp(curDay.TXK)}</span>
                    <b class="temp-{tempClass}">{tempSentence}</b>. {#if tempRecord}<span
                            class="temp-record">{@html tempRecord}</span
                        >{/if}
                </div>
            </div>
            <div class="flex">
                <div><i class="g-icon">🌧️</i></div>
                <div>
                    In den letzten 30 Tagen hat es <b class="rain-{precipClass}">{precipSentence}</b
                    >
                    (<span>{@html fmtRain(curDay.rain30days).replace(' ', '&nbsp;')}</span>).
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .topinfo :global(b) {
        font-weight: bold;
        font-family: sans_bold;
    }
    h4 {
        font-size: 1.35rem;
        font-weight: normal;
        font-family: sans_reg;
        margin-bottom: 0.5rem;
    }
    .topinfo {
        padding: 20px;
        border-radius: 5px;
        border-bottom: 1px solid #eeee;
        margin-bottom: 2rem;
        margin-right: 5px;
        font-size: 1.35rem;
        border: 2px solid;
        box-shadow: 5px 5px rgba(0, 0, 0, 0.07);
    }
    .flex {
        display: flex;
        width: 100%;
    }
    b {
        padding: 2px 0.5ex;
        border-radius: 4px;
        display: inline;
    }
    .topinfo :global(.temp-high) {
        background: #dc35453b;
    }

    .topinfo :global(.temp-low) {
        background: #17a2b82b;
    }
    .temp-normal,
    .rain-normal {
        background: #eee;
        color: #333;
    }
    .rain-high {
        background: #007bff30;
    }
    .rain-low {
        background: #fd7e1442;
    }
    strong {
        font-weight: bold;
        font-family: sans_bold;
    }
    i.g-icon {
        font-style: normal;
        background: white;
        display: inline-block;
        border-radius: 50%;
        text-align: center;
        font-size: 1.5rem;
        width: 1.5em;
        height: 1.5em;
        margin-right: 10px;
    }
</style>
