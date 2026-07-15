"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

const articles = [
  {
    title: "Sơn Tùng M-TP eMagazine",
    description: "Câu chuyện tương tư của một chàng trai.",
    img: "/images/media/sontungP.jpg",
    href: "/eMagazine/sontung",
  },
  {
    title: "NCS eMagazine",
    description: "Câu chuyện âm nhạc và cảm hứng.",
    img: "/images/user/NCS.jpg",
    href: "/eMagazine/ncs",
  },
  {
    title: "Weeknd eMagazine",
    description: "Câu chuyện âm nhạc.",
    img: "/images/media/weeknd01.jpg",
    href: "/eMagazine/ncs",
  },
  {
    title: "BLACKPINK eMagazine",
    description:
      "A visual story about four distinct identities, global influence, iconic performances, and the black-and-pink universe that shaped modern K-pop.",
    img: "/images/media/blackpink-main.jpg",
    href: "/eMagazine/blackpink",
  },
];

export default function EMagazinePage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#05070A",
        color: "#fff",
        px: { xs: 2, md: 8 },
        py: { xs: 8, md: 12 },
      }}
    >
      <Typography
        variant="h1"
        sx={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: { xs: 42, md: 72 },
          mb: 6,
        }}
      >
        eMagazine
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          gap: 4,
          maxWidth: 1100,
          mx: "auto",
        }}
      >
        {articles.map((item) => (
          <Card
            key={item.href}
            onClick={() => router.push(item.href)}
            sx={{
              cursor: "pointer",
              bgcolor: "#111318",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "24px",
              overflow: "hidden",
              transition: "0.25s ease",
              "&:hover": {
                transform: "translateY(-6px)",
                borderColor: "rgba(0,255,224,0.45)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
              },
            }}
          >
            <Box
              component="img"
              src={item.img}
              alt={item.title}
              sx={{
                width: "100%",
                height: 320,
                objectFit: "cover",
                display: "block",
              }}
            />

            <Box sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 900,
                  mb: 1,
                }}
              >
                {item.title}
              </Typography>

              <Typography sx={{ color: "#8b949e", fontWeight: 600 }}>
                {item.description}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
