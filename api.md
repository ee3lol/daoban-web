# Daoban Scraper API Documentation

Welcome to the Daoban Scraper API! This API aggregates extremely fast streaming sources and subtitles for Movies and TV shows.

## Base URL
**Production:** `https://api.daoban.lol`  
**Development:** `http://localhost:3001`

## Security & Authentication
This API is strictly protected from scraping and unauthorized access.

1. **API Key Requirement**: 
   Every single request MUST include the `x-daoban-api-key` header. If it is missing or incorrect, the server will instantly reject the request with a `401 Unauthorized` error.
2. **Strict CORS**:
   The API will only accept requests originating from allowed domains (e.g., `https://daoban.lol`, `https://www.daoban.lol`). Attempting to use this API from another website will result in a browser CORS error.

### Example Request Header
```http
x-daoban-api-key: your-secure-api-key
```

---

## Endpoints

### 1. Get Movie Sources
Fetches stream sources, subtitles, and media details for a specific movie.

**Endpoint:** `GET /api/movie/:tmdbId`

**Parameters:**
- `tmdbId` (String): The official TMDB ID of the movie (e.g., `550` for Fight Club).

**Example Request:**
```bash
curl -H "x-daoban-api-key: daoban-dev-key" https://api.daoban.lol/api/movie/550
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "media": {
    "id": "550",
    "title": "Fight Club",
    "description": "A ticking-time-bomb insomniac...",
    "poster": "https://image.tmdb.org/t/p/w500/...",
    "cover": "https://image.tmdb.org/t/p/w1280/...",
    "type": "movie",
    "releaseYear": 1999,
    "status": "Completed",
    "genres": ["Drama", "Thriller"],
    "rating": 8.437
  },
  "sources": [
    {
      "quality": "auto",
      "url": "https://example.com/master.m3u8",
      "isM3U8": true,
      "isMP4": false,
      "serverName": "1embed-MAIN",
      "headers": {
        "Referer": "https://example.com/",
        "Origin": "https://example.com"
      },
      "subtitles": [
        {
          "lang": "English",
          "url": "https://example.com/English.vtt",
          "format": "vtt"
        }
      ]
    }
  ]
}
```

---

### 2. Get TV Show Sources
Fetches stream sources, subtitles, and media details for a specific TV show episode.

**Endpoint:** `GET /api/tv/:tmdbId/:season/:episode`

**Parameters:**
- `tmdbId` (String): The official TMDB ID of the TV show (e.g., `1396` for Breaking Bad).
- `season` (Number): The season number.
- `episode` (Number): The episode number.

**Example Request:**
```bash
curl -H "x-daoban-api-key: daoban-dev-key" https://api.daoban.lol/api/tv/1396/1/1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "media": {
    "id": "1396",
    "title": "Breaking Bad",
    "type": "tv",
    "releaseYear": 2008,
    "status": "Completed",
    "genres": ["Drama"],
    "rating": 8.9
  },
  "season": 1,
  "episode": 1,
  "sources": [
    {
      "quality": "auto",
      "url": "https://example.com/tv/master.m3u8",
      "isM3U8": true,
      "isMP4": false,
      "serverName": "1embed-MAIN",
      "headers": {
        "Referer": "https://example.com/"
      }
    }
  ]
}
```

---

### 3. Get Subtitles Only
Sometimes you just need to fetch the available subtitles without waiting for stream extraction.

**Endpoint:** `GET /api/subtitles/:type/:tmdbId`

**Parameters:**
- `type` (String): Either `movie` or `tv`.
- `tmdbId` (String): The official TMDB ID.

**Query Parameters:**
- `s` (Number) [Optional]: Season number (required if `type=tv`, defaults to 1).
- `e` (Number) [Optional]: Episode number (required if `type=tv`, defaults to 1).

**Example Request:**
```bash
curl -H "x-daoban-api-key: daoban-dev-key" "https://api.daoban.lol/api/subtitles/tv/1396?s=1&e=1"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "subtitles": [
    {
      "lang": "English",
      "url": "https://example.com/subtitles/en.vtt",
      "format": "vtt"
    },
    {
      "lang": "Spanish",
      "url": "https://example.com/subtitles/es.vtt",
      "format": "vtt"
    }
  ]
}
```

---

## Player Guidelines for Frontend Developers

When implementing the video player (e.g., Vidstack, Video.js, or HLS.js), you **must** pay attention to the `headers` object returned in the `sources` array.

```json
"headers": {
  "Referer": "https://example.com/",
  "Origin": "https://example.com"
}
```

Many scraper sources will reject the M3U8 stream connection if these headers are not included in the video player's network requests. Ensure your video player is configured to pass these headers through if the browser allows, or rely on the proxy routing if necessary.
