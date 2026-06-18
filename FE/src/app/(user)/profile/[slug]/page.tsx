import { sendRequest } from "@/utils/api";
import {
    Avatar,
    Box,
    Button,
    Container,
    Divider,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
    title: "Track của bạn",
    description: "miêu tả thôi mà",
};

const waveHeights = [
    18, 28, 40, 24, 34, 52, 31, 44, 20, 38, 26, 48,
    30, 42, 22, 36, 50, 29, 41, 25, 47, 33, 39, 21,
];

const toImageUrl = (value?: string) => {
    if (!value) return "";

    if (value.startsWith("http")) return value;
    if (value.startsWith("/")) return value;

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/${value}`;
};

const Waveform = () => {
    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={0.25}
            sx={{
                height: 58,
                overflow: "hidden",
                mt: 2,
                mb: 1.5,
            }}
        >
            {Array.from({ length: 150 }).map((_, index) => (
                <Box
                    key={index}
                    sx={{
                        width: 2,
                        height: `${waveHeights[index % waveHeights.length]}px`,
                        bgcolor: "#aaa",
                        borderRadius: "2px",
                        opacity: index < 95 ? 1 : 0.55,
                    }}
                />
            ))}
        </Stack>
    );
};

const TrackItem = ({ data, index }: { data: ITrackTop; index: number }) => {
    const item = data as any;

    const title =
        item.title ||
        item.name ||
        item.trackName ||
        "Untitled track";

    const artist =
        item.uploader?.name ||
        item.user?.name ||
        item.artist ||
        "Unknown artist";

    const img =
        toImageUrl(item.imgUrl) ||
        toImageUrl(item.image) ||
        toImageUrl(item.trackImage) ||
        toImageUrl(item.thumbnail);

    const listens =
        item.countPlay ||
        item.totalPlay ||
        item.views ||
        item.listens ||
        0;

    return (
        <Box sx={{ mb: 4 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems="flex-start"
            >
                <Box
                    sx={{
                        width: { xs: "100%", sm: 160 },
                        height: 160,
                        bgcolor: "#2b2b2b",
                        flexShrink: 0,
                        backgroundImage: img ? `url(${img})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={2}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Button
                                sx={{
                                    minWidth: 44,
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    bgcolor: "#fff",
                                    color: "#000",
                                    fontSize: 22,
                                    "&:hover": {
                                        bgcolor: "#eee",
                                    },
                                }}
                            >
                                ▶
                            </Button>

                            <Box>
                                <Typography
                                    sx={{
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 15,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {title}
                                </Typography>

                                <Typography
                                    sx={{
                                        color: "#bbb",
                                        fontSize: 13,
                                    }}
                                >
                                    {artist}
                                </Typography>
                            </Box>
                        </Stack>

                        <Typography sx={{ color: "#aaa", fontSize: 12 }}>
                            1 day ago
                        </Typography>
                    </Stack>

                    <Waveform />

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >
                        <Typography
                            sx={{
                                color: "#ccc",
                                fontSize: 13,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {index + 1} · {artist} · {title}
                        </Typography>

                        <Typography sx={{ color: "#aaa", fontSize: 12 }}>
                            ▶ {listens}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        {["↗", "⧉", "✎", "♥", "⋯"].map((label) => (
                            <Button
                                key={label}
                                size="small"
                                sx={{
                                    minWidth: 38,
                                    height: 32,
                                    bgcolor: "#242424",
                                    color: "#fff",
                                    borderRadius: 1,
                                    fontSize: 14,
                                    "&:hover": {
                                        bgcolor: "#333",
                                    },
                                }}
                            >
                                {label}
                            </Button>
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Box>
    );
};

const EmptyTracks = () => {
    return (
        <Box
            sx={{
                py: 8,
                textAlign: "center",
                color: "#fff",
            }}
        >
            <Typography sx={{ color: "#bbb", mb: 2 }}>
                More uploads means more listeners.
            </Typography>

            <Button
                sx={{
                    bgcolor: "#fff",
                    color: "#000",
                    px: 3,
                    fontWeight: 700,
                    "&:hover": {
                        bgcolor: "#eee",
                    },
                }}
            >
                Upload more
            </Button>
        </Box>
    );
};

const BottomPlayer = () => {
    return (
        <Box
            sx={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                height: 58,
                bgcolor: "#2f2f2f",
                borderTop: "1px solid #444",
                zIndex: 999,
            }}
        >
            <Container maxWidth="lg" sx={{ height: "100%" }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ height: "100%" }}
                >
                    <Typography sx={{ color: "#fff", fontSize: 22 }}>‹</Typography>
                    <Button
                        sx={{
                            minWidth: 36,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            bgcolor: "#fff",
                            color: "#000",
                            "&:hover": {
                                bgcolor: "#eee",
                            },
                        }}
                    >
                        ▶
                    </Button>
                    <Typography sx={{ color: "#fff", fontSize: 22 }}>›</Typography>

                    <Typography sx={{ color: "#fff", fontSize: 13 }}>
                        0:00
                    </Typography>

                    <Box
                        sx={{
                            flex: 1,
                            height: 2,
                            bgcolor: "#666",
                            borderRadius: 2,
                        }}
                    />

                    <Typography sx={{ color: "#fff", fontSize: 13 }}>
                        2:21
                    </Typography>

                    <Typography sx={{ color: "#fff", fontSize: 18 }}>🔊</Typography>
                </Stack>
            </Container>
        </Box>
    );
};

const ProfilePage = async ({ params }: { params: { slug: string } }) => {
    const tracks = await sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/users?current=1&pageSize=10`,
        method: "POST",
        body: { id: params.slug },
        nextOption: {
            next: { tags: ["track-by-profile"] },
        },
    });

    const data = tracks?.data?.result ?? [];

    const profileName = "lâm hùng";
    const username = "lâm hùng";
    const location = "Ho Chi Minh City, Viet Nam";
const profileTabs = [
    {
        label: "All",
        href: `/profile/${params.slug}`,
    },
    {
        label: "Popular tracks",
        href: `/profile/${params.slug}/popular-tracks`,
    },
    {
        label: "Tracks",
        href: `/profile/${params.slug}/tracks`,
    },
    {
        label: "Albums",
        href: `/profile/${params.slug}/albums`,
    },
    {
        label: "Playlists",
        href: `/profile/${params.slug}/playlists`,
    },
    {
        label: "Reposts",
        href: `/profile/${params.slug}/reposts`,
    },
];
    return (
        <Box
            sx={{
                bgcolor: "#111",
                minHeight: "100vh",
                color: "#fff",
                pb: 10,
            }}
        >
            <Container maxWidth="lg" disableGutters>
                <Box
                    sx={{
                        height: { xs: 240, md: 250 },
                        bgcolor: "#9a828d",
                        position: "relative",
                        px: { xs: 2, md: 4 },
                        py: 3,
                        display: "flex",
                        alignItems: "flex-start",
                    }}
                >
                    <Button
                        size="small"
                        sx={{
                            position: "absolute",
                            top: 32,
                            right: 32,
                            bgcolor: "#000",
                            color: "#fff",
                            textTransform: "none",
                            fontWeight: 700,
                            "&:hover": {
                                bgcolor: "#222",
                            },
                        }}
                    >
                        Upload header image
                    </Button>

                    <Stack
                        direction="row"
                        spacing={3}
                        alignItems="center"
                        sx={{ mt: 2 }}
                    >
                        <Box
                            sx={{
                                width: { xs: 120, md: 180 },
                                height: { xs: 120, md: 180 },
                                borderRadius: "50%",
                                bgcolor: "rgba(90, 60, 80, 0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Button
                                size="small"
                                sx={{
                                    bgcolor: "#000",
                                    color: "#fff",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    "&:hover": {
                                        bgcolor: "#222",
                                    },
                                }}
                            >
                                Upload image
                            </Button>
                        </Box>

                        <Box>
                            <Typography
                                sx={{
                                    display: "inline-block",
                                    bgcolor: "#000",
                                    color: "#fff",
                                    px: 1,
                                    py: 0.5,
                                    fontSize: { xs: 24, md: 34 },
                                    fontWeight: 800,
                                    lineHeight: 1.1,
                                    mb: 1,
                                }}
                            >
                                {profileName}
                            </Typography>

                            <br />

                            <Typography
                                sx={{
                                    display: "inline-block",
                                    bgcolor: "#000",
                                    color: "#ccc",
                                    px: 1,
                                    py: 0.5,
                                    fontSize: 16,
                                    mb: 1,
                                }}
                            >
                                {username}
                            </Typography>

                            <br />

                            <Typography
                                sx={{
                                    display: "inline-block",
                                    bgcolor: "#000",
                                    color: "#ccc",
                                    px: 1,
                                    py: 0.5,
                                    fontSize: 16,
                                }}
                            >
                                {location}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                        borderBottom: "1px solid #333",
                        px: 1,
                        py: 2,
                    }}
                >
                   <Stack direction="row" spacing={3}>
    {profileTabs.map((tab, index) => (
        <Box
            key={tab.href}
            component={Link}
            href={tab.href}
            sx={{
                color: index === 0 ? "#fff" : "#aaa",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                pb: 1,
                textDecoration: "none",
                borderBottom:
                    index === 0
                        ? "1px solid #fff"
                        : "1px solid transparent",

                "&:hover": {
                    color: "#fff",
                },
            }}
        >
            {tab.label}
        </Box>
    ))}
</Stack>

                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            sx={{
                                bgcolor: "#242424",
                                color: "#fff",
                                textTransform: "none",
                                fontWeight: 700,
                                "&:hover": {
                                    bgcolor: "#333",
                                },
                            }}
                        >
                            Share
                        </Button>

                        <Button
                            size="small"
                            sx={{
                                bgcolor: "#242424",
                                color: "#fff",
                                textTransform: "none",
                                fontWeight: 700,
                                "&:hover": {
                                    bgcolor: "#333",
                                },
                            }}
                        >
                            Edit
                        </Button>
                    </Stack>
                </Stack>

                <Grid container spacing={4} sx={{ px: 0, pt: 4 }}>
                    <Grid item xs={12} md={8}>
                        <Typography
                            sx={{
                                fontSize: 24,
                                fontWeight: 800,
                                mb: 2,
                            }}
                        >
                            Recent
                        </Typography>

                        {data.length > 0 ? (
                            data.map((item: ITrackTop, index: number) => (
                                <TrackItem
                                    key={(item as any)._id || index}
                                    data={item}
                                    index={index}
                                />
                            ))
                        ) : (
                            <EmptyTracks />
                        )}
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Box
                            sx={{
                                borderLeft: { xs: "none", md: "1px solid #333" },
                                pl: { xs: 0, md: 4 },
                                color: "#fff",
                            }}
                        >
                            <Stack direction="row" spacing={6} sx={{ mb: 4 }}>
                                <Box>
                                    <Typography sx={{ color: "#aaa", fontSize: 13 }}>
                                        Followers
                                    </Typography>
                                    <Typography sx={{ fontSize: 30, fontWeight: 800 }}>
                                        0
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography sx={{ color: "#aaa", fontSize: 13 }}>
                                        Following
                                    </Typography>
                                    <Typography sx={{ fontSize: 30, fontWeight: 800 }}>
                                        1
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography sx={{ color: "#aaa", fontSize: 13 }}>
                                        Tracks
                                    </Typography>
                                    <Typography sx={{ fontSize: 30, fontWeight: 800 }}>
                                        {data.length}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Divider sx={{ borderColor: "#333", mb: 3 }} />

                            <Typography
                                sx={{
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: 13,
                                    mb: 1,
                                }}
                            >
                                ON TOUR
                            </Typography>

                            <Typography
                                sx={{
                                    color: "#ccc",
                                    fontSize: 13,
                                    mb: 2,
                                }}
                            >
                                With an Artist Pro account, you can create ticketed live
                                events on SoundCloud, and list existing events.
                            </Typography>

                            <Button
                                fullWidth
                                sx={{
                                    bgcolor: "#fff",
                                    color: "#000",
                                    borderRadius: 10,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    mb: 4,
                                    "&:hover": {
                                        bgcolor: "#eee",
                                    },
                                }}
                            >
                                Upgrade to Artist Pro
                            </Button>

                            <Divider sx={{ borderColor: "#333", mb: 3 }} />

                            <Typography
                                sx={{
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: 13,
                                    mb: 2,
                                }}
                            >
                                1 FOLLOWING
                            </Typography>

                            <Stack
                                direction="row"
                                spacing={1.5}
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar sx={{ width: 44, height: 44 }} />
                                    <Box>
                                        <Typography
                                            sx={{
                                                color: "#fff",
                                                fontWeight: 700,
                                                fontSize: 13,
                                            }}
                                        >
                                            La Onda: Latin
                                        </Typography>
                                        <Typography sx={{ color: "#999", fontSize: 12 }}>
                                            11K
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Button
                                    size="small"
                                    sx={{
                                        bgcolor: "#333",
                                        color: "#fff",
                                        textTransform: "none",
                                        fontWeight: 700,
                                        "&:hover": {
                                            bgcolor: "#444",
                                        },
                                    }}
                                >
                                    Following
                                </Button>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            <BottomPlayer />
        </Box>
    );
};

export default ProfilePage;