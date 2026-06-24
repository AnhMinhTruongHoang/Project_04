"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
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
  padding: 0,
  height: "100%",
  backgroundColor: "#16181d",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  borderRadius: "24px",
  overflow: "hidden",
  transition: "0.25s ease",

  "&:hover": {
    backgroundColor: "#1d2027",
    cursor: "pointer",
    borderColor: "rgba(0,255,224,0.45)",
    transform: "translateY(-6px)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.55)",
  },

  "&:focus-visible": {
    outline: "3px solid",
    outlineColor: "rgba(0, 255, 224, 0.5)",
    outlineOffset: "2px",
  },
});

const StyledCardContent = styled(CardContent)({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 18,
  flexGrow: 1,

  "&:last-child": {
    paddingBottom: 18,
  },
});

const StyledTypography = styled(Typography)({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

function Author({ authors }: { authors: AuthorType[] }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1,
          alignItems: "center",
          minWidth: 0,
        }}
      >
        <AvatarGroup max={3}>
          {authors.map((author, index) => (
            <Avatar
              key={index}
              alt={author.name}
              src={author.avatar}
              sx={{ width: 24, height: 24 }}
            />
          ))}
        </AvatarGroup>

        <Typography
          variant="caption"
          noWrap
          sx={{
            color: "#c9d1d9",
            fontWeight: 700,
          }}
        >
          {authors.map((author) => author.name).join(", ")}
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "#8b949e",
          fontWeight: 700,
          flexShrink: 0,
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
  const [focusedCardIndex, setFocusedCardIndex] = React.useState<number | null>(
    null
  );

  const handleFocus = (index: number) => {
    setFocusedCardIndex(index);
  };

  const handleBlur = () => {
    setFocusedCardIndex(null);
  };

  const renderCard = (index: number, showImage = true) => {
    const card = cards[index];

    if (!card) return null;

    return (
      <StyledCard
        variant="outlined"
        onClick={() => router.push(card.href)}
        onFocus={() => handleFocus(index)}
        onBlur={handleBlur}
        tabIndex={0}
        className={focusedCardIndex === index ? "Mui-focused" : ""}
        sx={{ height: "100%" }}
      >
        {showImage && (
          <CardMedia
            component="img"
            alt={card.title}
            image={card.img}
            sx={{
              aspectRatio: "16 / 9",
              objectFit: "cover",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        )}

        <StyledCardContent>
          <Typography
            gutterBottom
            variant="caption"
            component="div"
            sx={{
              color: "#00ffe0",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {card.tag}
          </Typography>

          <Typography
            gutterBottom
            variant="h6"
            component="div"
            sx={{
              color: "#ffffff",
              fontWeight: 900,
              lineHeight: 1.25,
            }}
          >
            {card.title}
          </Typography>

          <StyledTypography
            variant="body2"
            gutterBottom
            sx={{
              color: "#a7a7a7",
              lineHeight: 1.7,
            }}
          >
            {card.description}
          </StyledTypography>
        </StyledCardContent>

        <Author authors={card.authors} />
      </StyledCard>
    );
  };

  return (
    <Grid container spacing={2} columns={12}>
      <Grid item xs={12} md={6}>
        {renderCard(0)}
      </Grid>

      <Grid item xs={12} md={6}>
        {renderCard(1)}
      </Grid>

      <Grid item xs={12} md={4}>
        {renderCard(2)}
      </Grid>

      <Grid item xs={12} md={4}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            height: "100%",
          }}
        >
          {renderCard(3, false)}
          {renderCard(4, false)}
        </Box>
      </Grid>

      <Grid item xs={12} md={4}>
        {renderCard(5)}
      </Grid>
    </Grid>
  );
}
