import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.options";
import {
  getLikedTracksApi,
  getMyFollowingApi,
  getPlaylistsByUserApi,
} from "@/utils/api";
import LibraryView from "./components/libraryView";

export const metadata: Metadata = {
  title: "Library",
  description: "Your SoundClone library",
};

const getResultList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data?.result)) return data.data.result;
  return [];
};

const LibraryPage = async () => {
  const session = await getServerSession(authOptions);

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token;

  const [likedTracksRes, playlistsRes, followingRes] = await Promise.all([
    getLikedTracksApi(accessToken),

    getPlaylistsByUserApi(accessToken),

    getMyFollowingApi(accessToken),
  ]);

  const likedTracks = getResultList<ITrackTop>(likedTracksRes?.data);
  const playlistItems = getResultList<IPlaylist>(playlistsRes?.data);
  const followingUsers = getResultList<IUser>(followingRes?.data);

  const playlists = playlistItems.filter((item: any) => !item?.isAlbum);
  const albums = playlistItems.filter((item: any) => item?.isAlbum);

  return (
    <LibraryView
      likedTracks={likedTracks}
      playlists={playlists}
      albums={albums}
      followingUsers={followingUsers}
    />
  );
};

export default LibraryPage;
