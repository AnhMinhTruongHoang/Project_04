"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import LibrarySection from "./librarySection";
import TrackCard from "./trackCard";
import PlaylistCard from "./playlistCard";
import ArtistCircleCard from "./artistCircleCard";
import LibraryTabs from "./libraryTabs";

type Props = {
  likedTracks?: any[];
  playlists?: any[];
  albums?: any[];
  followingUsers?: any[];
};

type LibraryTab =
  | "overview"
  | "likes"
  | "playlists"
  | "albums"
  | "stations"
  | "following"
  | "history";

const tabs: { label: string; value: LibraryTab }[] = [
  { label: "Overview", value: "overview" },
  { label: "Likes", value: "likes" },
  { label: "Playlists", value: "playlists" },
  { label: "Albums", value: "albums" },
  { label: "Stations", value: "stations" },
  { label: "Following", value: "following" },
  { label: "History", value: "history" },
];

const LibraryView = ({
  likedTracks = [],
  playlists = [],
  albums = [],
  followingUsers = [],
}: Props) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>("overview");
  const [recentTracks, setRecentTracks] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("listening-history") ||
        localStorage.getItem("soundclone-listening-history") ||
        "[]";

      const parsed = JSON.parse(raw);

      setRecentTracks(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentTracks([]);
    }
  }, []);

  const visibleRecentlyPlayed = recentTracks.slice(0, 6);
  const visibleLikedTracks = likedTracks.slice(0, 6);
  const visiblePlaylists = playlists.slice(0, 6);
  const visibleAlbums = albums.slice(0, 6);
  const visibleFollowingUsers = followingUsers.slice(0, 6);

  const showOverview = activeTab === "overview";

  const content = useMemo(() => {
    if (activeTab === "likes") {
      return (
        <LibrarySection title="Likes" emptyText="No liked tracks yet.">
          {visibleLikedTracks.map((track, index) => (
            <TrackCard key={track?._id || track?.id || index} track={track} />
          ))}
        </LibrarySection>
      );
    }

    if (activeTab === "playlists") {
      return (
        <LibrarySection
          title="Playlists"
          rightSlot="All"
          emptyText="No playlists yet."
        >
          {visiblePlaylists.map((playlist, index) => (
            <PlaylistCard
              key={playlist?._id || playlist?.id || index}
              playlist={playlist}
            />
          ))}
        </LibrarySection>
      );
    }

    if (activeTab === "albums") {
      return (
        <LibrarySection
          title="Albums"
          rightSlot="All"
          emptyText="No albums yet."
        >
          {visibleAlbums.map((album, index) => (
            <PlaylistCard
              key={album?._id || album?.id || index}
              playlist={album}
            />
          ))}
        </LibrarySection>
      );
    }

    if (activeTab === "following") {
      return (
        <LibrarySection
          title="Following"
          rightSlot={`${followingUsers.length} following`}
          emptyText="You are not following anyone yet."
        >
          {visibleFollowingUsers.map((artist, index) => (
            <ArtistCircleCard
              key={artist?._id || artist?.id || index}
              artist={artist}
            />
          ))}
        </LibrarySection>
      );
    }

    if (activeTab === "history") {
      return (
        <LibrarySection
          title="Recently played"
          emptyText="No listening history yet."
        >
          {visibleRecentlyPlayed.map((track, index) => (
            <TrackCard key={track?._id || track?.id || index} track={track} />
          ))}
        </LibrarySection>
      );
    }

    return null;
  }, [
    activeTab,
    followingUsers.length,
    visibleAlbums,
    visibleFollowingUsers,
    visibleLikedTracks,
    visiblePlaylists,
    visibleRecentlyPlayed,
  ]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 10% 0%, rgba(255,85,0,0.08), transparent 28%), linear-gradient(180deg, #111314 0%, #0b0d0e 100%)",
        color: "#ffffff",
        px: { xs: 2, md: 3.5 },
        py: 2.5,
        pb: 10,
      }}
    >
      <Box
        sx={{
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.07)",
          color: "#C7CCD3",
          fontSize: 12,
          fontWeight: 800,
          px: 2,
          py: 1,
          mb: 3,
          textAlign: "center",
        }}
      >
        Uploading tracks just got way easier: upload, get heard, and get paid in
        one seamless experience.{" "}
        <Box component="span" sx={{ color: "#00FFE0" }}>
          Try it out
        </Box>
      </Box>

      <LibraryTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {showOverview ? (
        <Box sx={{ mt: 3 }}>
          <LibrarySection
            title="Recently played"
            emptyText="No listening history yet."
          >
            {visibleRecentlyPlayed.map((track, index) => (
              <TrackCard key={track?._id || track?.id || index} track={track} />
            ))}
          </LibrarySection>

          <LibrarySection
            title="Likes"
            rightSlot={`${likedTracks.length} liked tracks`}
            emptyText="No liked tracks yet."
          >
            {visibleLikedTracks.map((track, index) => (
              <TrackCard key={track?._id || track?.id || index} track={track} />
            ))}
          </LibrarySection>

          <LibrarySection
            title="Playlists"
            rightSlot="All"
            emptyText="No playlists yet."
          >
            {visiblePlaylists.map((playlist, index) => (
              <PlaylistCard
                key={playlist?._id || playlist?.id || index}
                playlist={playlist}
              />
            ))}
          </LibrarySection>

          <LibrarySection
            title="Albums"
            rightSlot="All"
            emptyText="No albums yet."
          >
            {visibleAlbums.map((album, index) => (
              <PlaylistCard
                key={album?._id || album?.id || index}
                playlist={album}
              />
            ))}
          </LibrarySection>

          <LibrarySection
            title="Following"
            rightSlot={`${followingUsers.length} following`}
            emptyText="You are not following anyone yet."
          >
            {visibleFollowingUsers.map((artist, index) => (
              <ArtistCircleCard
                key={artist?._id || artist?.id || index}
                artist={artist}
              />
            ))}
          </LibrarySection>
        </Box>
      ) : (
        <Box sx={{ mt: 3 }}>{content}</Box>
      )}
    </Box>
  );
};

export default LibraryView;
