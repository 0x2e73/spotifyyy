// Seed songs collection on first container init.
// Why: Mongo image runs *.js in /docker-entrypoint-initdb.d automatically.

const dbName = "musicdb";
const collectionName = "songs";

const raw = cat("/docker-entrypoint-initdb.d/songs.json");
const songs = JSON.parse(raw);

if (!Array.isArray(songs)) {
  throw new Error("songs.json must be a JSON array");
}

db = db.getSiblingDB(dbName);

db[collectionName].deleteMany({});
db[collectionName].insertMany(songs);

print(`Seeded ${songs.length} songs into ${dbName}.${collectionName}`);

