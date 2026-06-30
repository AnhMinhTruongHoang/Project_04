# SoundClone Frontend

Frontend for the SoundClone music streaming project, built with Next.js, TypeScript, MUI, NextAuth, and React.

## Requirements

Before running the frontend, make sure you have installed:

```bash
Node.js >= 18
npm
```

Backend must also be running before login, loading tracks, playlists, comments, and user data.

Default backend URL:

```txt
http://localhost:8000
```

## Installation

Clone the project and go to the frontend folder:

```bash
cd FE
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a file named `.env.development` or `.env.local` in the `FE` folder.

Example:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
REVALIDATE_SECRET=your_revalidate_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
TOKEN_EXPIRE_NUMBER=30
TOKEN_EXPIRE_UNIT=days
```

Do not commit real secrets to GitHub.

If the app shows errors like:

```txt
/api/v1/...
No static resource api/v1/...
404
```

it usually means the frontend is calling the wrong API URL. Check that:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

is set correctly and restart the frontend after changing `.env`.

## Run Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Build Production

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Backend Setup Reminder

The backend should run at:

```txt
http://localhost:8000
```

Default test accounts may be:

```txt
admin@gmail.com
123456
```

```txt
user@gmail.com
123456
```

Backend database and seed data must be ready before using login or loading tracks.

## Common Issues

### Login does not work

Check backend is running:

```txt
http://localhost:8000
```

Check frontend env:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Restart frontend:

```bash
npm run dev
```

### Tracks do not load

Open this URL in browser:

```txt
http://localhost:8000/api/v1/tracks/top?category=ncs
```

If it returns JSON data, backend is working and the issue is likely frontend API URL configuration.

### Environment variables not applied

After editing `.env.development` or `.env.local`, stop the frontend server and run it again:

```bash
npm run dev
```

## Contact

If you need the correct environment variables, backend URL, OAuth keys, or deployment configuration, please contact the project owner.

Project owner:

```txt
Minh
```

GitHub:

```txt
https://github.com/AnhMinhTruongHoang
```
