const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const os = require('os');
const decompress = require('decompress');
const { spawn } = require('child_process');

const TOR_BASE_URL = "https://dist.torproject.org/torbrowser/";
const TOR_INSTALL_DIR = path.join(__dirname, 'tor');
const TOR_VERSION_FILE = path.join(TOR_INSTALL_DIR, 'version.txt');

async function getLatestTorVersion() {
    try {
        const response = await axios.get(TOR_BASE_URL);
        const $ = cheerio.load(response.data);

        // Obtém os diretórios de versão
        const versions = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (/^\d+\.\d+/.test(href)) {
                versions.push(href.replace(/\/$/, ''));
            }
        });

        // Ordena as versões
        versions.sort((a, b) => {
            const versionA = a.split('.').map(Number);
            const versionB = b.split('.').map(Number);
            for (let i = 0; i < versionA.length; i++) {
                if (versionA[i] !== versionB[i]) {
                    return versionB[i] - versionA[i];
                }
            }
            return 0;
        });

        return versions[0];
    } catch (error) {
        console.error("Erro ao obter a última versão do Tor:", error);
        return null;
    }
}

function getTorBinaryName(version) {
    const platform = os.platform();
    const arch = os.arch();

    if (platform === 'win32') {
        return `tor-expert-bundle-windows-${arch === 'x64' ? 'x86_64' : 'i686'}-${version}.tar.gz`;
    } else if (platform === 'darwin') {
        const archName = arch === 'arm64' ? 'aarch64' : 'x86_64';
        return `tor-expert-bundle-macos-${archName}-${version}.tar.gz`;
    } else if (platform === 'linux') {
        const archName = arch === 'x64' ? 'x86_64' : 'i686';
        return `tor-expert-bundle-linux-${archName}-${version}.tar.gz`;
    } else {
        throw new Error(`Sistema operacional não suportado: ${platform}`);
    }
}

async function downloadTorBinary(version, binaryName) {
    const url = `${TOR_BASE_URL}${version}/${binaryName}`;
    const outputPath = path.join(__dirname, binaryName);

    try {
        console.log(`Baixando ${url}...`);
        const response = await axios.get(url, { responseType: 'stream' });
        const writer = fs.createWriteStream(outputPath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(outputPath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error("Erro ao baixar o binário do Tor:", error);
        return null;
    }
}

async function extractTorBinary(filePath) {
    try {
        console.log(`Extraindo ${filePath}...`);
        await decompress(filePath, TOR_INSTALL_DIR);
        console.log(`Extraído para ${TOR_INSTALL_DIR}`);
        return TOR_INSTALL_DIR;
    } catch (error) {
        console.error("Erro ao extrair o binário do Tor:", error);
        return null;
    }
}

function findTorExecutable() {
    const platform = os.platform();
    if (platform === 'win32') {
        return path.join(TOR_INSTALL_DIR, 'Tor', 'tor.exe');
    } else {
        return path.join(TOR_INSTALL_DIR, 'tor');
    }
}

function startTor(binaryPath, torrc) {
    console.log(`Iniciando o Tor a partir de ${binaryPath}...`);
    const torProcess = spawn(binaryPath, ["-f", torrc], { stdio: 'inherit' });

    torProcess.on('close', (code) => {
        console.log(`Tor finalizado com código ${code}`);
    });

    torProcess.on('error', (error) => {
        console.error("Erro ao iniciar o Tor:", error);
    });
}

function isTorInstalled(version) {
    try {
        if (!fs.existsSync(TOR_VERSION_FILE)) return false;
        const installedVersion = fs.readFileSync(TOR_VERSION_FILE, 'utf-8').trim();
        return installedVersion === version;
    } catch (error) {
        console.error("Erro ao verificar a instalação do Tor:", error);
        return false;
    }
}

function saveTorVersion(version) {
    try {
        fs.mkdirSync(TOR_INSTALL_DIR, { recursive: true });
        fs.writeFileSync(TOR_VERSION_FILE, version, 'utf-8');
    } catch (error) {
        console.error("Erro ao salvar a versão instalada do Tor:", error);
    }
}

(async () => {
    const version = await getLatestTorVersion();
    if (!version) return;

    console.log(`Última versão estável: ${version}`);

    if (isTorInstalled(version)) {
        console.log("Tor já está instalado na versão mais recente.");
    } else {
        const binaryName = getTorBinaryName(version);
        const downloadedPath = await downloadTorBinary(version, binaryName);

        if (!downloadedPath) return;

        const extractedPath = await extractTorBinary(downloadedPath);

        if (!extractedPath) return;

        saveTorVersion(version);
    }

    const torBinary = findTorExecutable();
    if (fs.existsSync(torBinary)) {
        startTor(torBinary, path.resolve(__dirname, "./torrc/torrc"));
    } else {
        console.error("Binário do Tor não encontrado após a extração.");
    }
})();
