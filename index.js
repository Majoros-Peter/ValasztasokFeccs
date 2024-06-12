const MEGYEURL = 'https://vtr.valasztas.hu/ep2024/data/06091753/ver/Megyek.json';
const MASIKURL = (maz, taz) => `https://vtr.valasztas.hu/ep2024/data/06120800/szavossz/${maz}/TelepEredm-${maz}-${taz}.json`;
const NEGYEDIKURL = 'https://vtr.valasztas.hu/onk2024/data/06091753/ver/Megyek.json';
const HARMADIKURL = 'https://vtr.valasztas.hu/onk2024/data/06120810/szavossz/09/SzeredmTelep-09-044.json';

let nagyLista = [];
//#region Feccsek
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, retries = 3, delayMs = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            return await response.json();
        } catch (error) {
            if (attempt === retries) {
                console.error(`Failed to fetch ${url} after ${retries} attempts:`, error);
                return null;
            }
            console.log(`Retrying fetch ${url} (${attempt}/${retries})...`);
            await delay(delayMs);
        }
    }
};

const feccs = async (url, func) => {
    const data = await fetchWithRetry(url);
    if (data) func(data);
};

const processData = async () => {
    const megyeData = await fetchWithRetry(MEGYEURL);
    if (!megyeData) return;

    const promises = [];
    for (const iterator of megyeData.list) {
        const megye = [];
        for (let index = 1; index < iterator.leiro.telep_db; index++) {
            const promise = fetchWithRetry(MASIKURL(iterator.leiro.maz, String(index).padStart(3, '0')))
                .then(masikData => {
                    if (masikData)megye.push(`${masikData.data.maz};${masikData.data.taz};${masikData.data.szavazott_osszesen};${masikData.data.tetelek.map(G => G.szavazat).join(';')}`);
                });
            promises.push(promise);
        }
        nagyLista.push(megye);
    }

    await Promise.all(promises);
    menthet();    
    console.log(nagyLista);
};
//#endregion

//#region FáljbaÍrás
const saveFile = async (fileName, content) => {
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
                {
                    description: 'Text Files',
                    accept: {'text/plain': ['.csv']}
                }
            ]
        });

        const writable = await handle.createWritable();

        await writable.write(content);
        
        await writable.close();
    } catch (error) {
        console.error('Error saving file:', error);
    }
};

const menthet = () =>{
    alert('Adatok betöltve!')
    document.querySelector('#mentes').disabled = false;
}
//#endregion

document.querySelector('#lekerdez').onclick = processData;
document.querySelector('#mentes').onclick = () => saveFile('output.csv', 'megyeKód;településKód;választókSzáma;érvénytelen;érvényes;1;2;3;4;5;6;7;8;9;10;11\n' + nagyLista.map(G => G.join('\n')).join('\n'));