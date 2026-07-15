"use client";

import { useRouter } from "next/navigation";

import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";

type AuthorType = {
  name: string;
  avatar: string;
};

export type EmagazineCardItem = {
  img: string;
  tag: string;
  title: string;
  description: string;
  href: string;
  authors: AuthorType[];
};

const StyledCard = styled(Card)({
  display: "flex",
  flexDirection: "column",

  width: "100%",
  height: "100%",
  minHeight: 520,

  padding: 0,
  overflow: "hidden",

  color: "#ffffff",
  backgroundColor: "#16181d",

  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "24px",

  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",

  cursor: "pointer",

  transition:
    "transform 220ms ease, border-color 220ms ease, background-color 220ms ease, box-shadow 220ms ease",

  "&:hover": {
    transform: "translateY(-6px)",

    backgroundColor: "#1d2027",
    borderColor: "rgba(0,255,224,0.45)",

    boxShadow: "0 26px 90px rgba(0,0,0,0.55)",
  },

  "&:focus-visible": {
    outline: "3px solid rgba(0,255,224,0.5)",
    outlineOffset: "3px",
  },
});

const StyledCardContent = styled(CardContent)({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,

  gap: 8,

  padding: 20,

  "&:last-child": {
    paddingBottom: 20,
  },
});

function Author({ authors }: { authors: AuthorType[] }) {
  return (
    <Box
      sx={{
        mt: "auto",
        px: 2.5,
        py: 2,

        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        gap: 2,

        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",

          gap: 1,
          minWidth: 0,
        }}
      >
        <AvatarGroup
          max={3}
          sx={{
            flexShrink: 0,

            "& .MuiAvatar-root": {
              width: 26,
              height: 26,

              fontSize: 11,

              border: "2px solid #16181d",
            },
          }}
        >
          {authors.map((author, index) => (
            <Avatar
              key={`${author.name}-${index}`}
              alt={author.name}
              src={author.avatar}
            />
          ))}
        </AvatarGroup>

        <Typography
          variant="caption"
          noWrap
          sx={{
            minWidth: 0,

            color: "#c9d1d9",

            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {authors.map((author) => author.name).join(", ")}
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          flexShrink: 0,

          color: "#8b949e",

          fontSize: 12,
          fontWeight: 700,
        }}
      >
        July 14, 2026
      </Typography>
    </Box>
  );
}

export default function EmagazineCardGrid({
  cards,
}: {
  cards: EmagazineCardItem[];
}) {
  const router = useRouter();

  const handleOpenCard = (href: string) => {
    router.push(href);
  };

  const handleKeyDown = (event: React.KeyboardEvent, href: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenCard(href);
    }
  };

  return (
    <Box
      sx={{
        display: "grid",

        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "repeat(2, minmax(0, 1fr))",
        },

        gridAutoRows: "1fr",

        gap: {
          xs: 2,
          md: 2.5,
        },

        width: "100%",
      }}
    >
      {cards.map((card, index) => (
        <StyledCard
          key={`${card.href}-${index}`}
          variant="outlined"
          role="button"
          tabIndex={0}
          onClick={() => handleOpenCard(card.href)}
          onKeyDown={(event) => handleKeyDown(event, card.href)}
        >
          <CardMedia
            component="img"
            image={card.img}
            alt={card.title}
            sx={{
              width: "100%",

              height: {
                xs: 220,
                sm: 250,
                md: 270,
              },

              flexShrink: 0,

              display: "block",

              objectFit: "cover",
              objectPosition: "center",

              backgroundColor: "#090a0d",

              borderBottom: "1px solid rgba(255,255,255,0.08)",

              transition: "transform 500ms ease",

              ".MuiCard-root:hover &": {
                transform: "scale(1.035)",
              },
            }}
          />

          <StyledCardContent>
            <Typography
              component="div"
              sx={{
                color: "#00ffe0",

                fontSize: 12,
                fontWeight: 900,

                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {card.tag}
            </Typography>

            <Typography
              component="h2"
              sx={{
                minHeight: {
                  xs: "auto",
                  md: 60,
                },

                color: "#ffffff",

                fontSize: {
                  xs: 20,
                  md: 22,
                },

                lineHeight: {
                  xs: "27px",
                  md: "30px",
                },

                fontWeight: 900,
                letterSpacing: "-0.025em",

                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,

                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {card.title}
            </Typography>

            <Typography
              component="p"
              sx={{
                color: "#a7a7a7",

                fontSize: 14,
                lineHeight: "24px",
                fontWeight: 500,

                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 3,

                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {card.description}
            </Typography>
          </StyledCardContent>

          <Author authors={card.authors} />
        </StyledCard>
      ))}
    </Box>
  );
}
