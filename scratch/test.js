const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const token = env.split('\n').find(line => line.startsWith('TMDB_READ_ACCESS_TOKEN=')).split('=')[1];

fetch('https://api.themoviedb.org/3/watch/providers/movie?watch_region=US', { headers: { Authorization: 'Bearer ' + token } })
  .then(res => res.json())
  .then(data => {
    const ids = [8, 119, 384, 337, 15, 350];
    const providers = data.results.filter(p => ids.includes(p.provider_id));
    console.log(providers.map(p => ({ name: p.provider_name, id: p.provider_id, logo: p.logo_path })));
  });
