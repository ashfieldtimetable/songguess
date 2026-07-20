import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const songsDir = path.join(__dirname, '../public/Songs');
const outputFile = path.join(songsDir, 'metadata.json');

async function generateMetadata() {
  const files = fs.readdirSync(songsDir);
  const metadataList = [];
  let idCounter = 1;

  for (const file of files) {
    if (file.toLowerCase().endsWith('.mp3')) {
      const filePath = path.join(songsDir, file);
      try {
        const metadata = await parseFile(filePath);
        const { common, format } = metadata;
        
        const trackNo = common.track && common.track.no ? common.track.no : idCounter++;
        metadataList.push({
          id: String(trackNo),
          filename: file,
          title: common.title || file.replace('.mp3', ''),
          artist: common.artist || 'Unknown Artist',
          album: common.album || 'Unknown Album',
          length: format.duration || 0,
          albumCover: '' // Not extracting images dynamically to keep it simple, unless needed
        });
        console.log(`Processed: ${file}`);
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
  }

  metadataList.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  fs.writeFileSync(outputFile, JSON.stringify(metadataList, null, 2));
  console.log(`\nSuccess! Wrote metadata for ${metadataList.length} songs to metadata.json`);
}

generateMetadata();
