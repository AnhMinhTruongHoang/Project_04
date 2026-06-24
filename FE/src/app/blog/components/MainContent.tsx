"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import RssFeedRoundedIcon from "@mui/icons-material/RssFeedRounded";
import Search from "./blogSearch";

const TEMP_IMAGE = "/images/user/NCS.jpg";
const TEMP_AVATAR = "/images/user/NCS.jpg";

const cardData = [
  {
    img: TEMP_IMAGE,
    tag: "Engineering",
    title: "Revolutionizing software development with cutting-edge tools",
    description:
      "Our latest engineering tools are designed to streamline workflows and boost productivity. Discover how these innovations are transforming the software development landscape.",
    authors: [
      { name: "Remy Sharp", avatar: TEMP_AVATAR },
      { name: "Travis Howard", avatar: TEMP_AVATAR },
    ],
  },
  {
    img: TEMP_IMAGE,
    tag: "Product",
    title: "Innovative product features that drive success",
    description:
      "Explore the key features of our latest product release that are helping businesses achieve their goals. From user-friendly interfaces to robust functionality, learn why our product stands out.",
    authors: [{ name: "Erica Johns", avatar: TEMP_AVATAR }],
  },
  {
    img: TEMP_IMAGE,
    tag: "Design",
    title: "Designing for the future: trends and insights",
    description:
      "Stay ahead of the curve with the latest design trends and insights. Our design team shares their expertise on creating intuitive and visually stunning user experiences.",
    authors: [{ name: "Kate Morrison", avatar: TEMP_AVATAR }],
  },
  {
    img: TEMP_IMAGE,
    tag: "Company",
    title: "Our company's journey: milestones and achievements",
    description:
      "Take a look at our company's journey and the milestones we've achieved along the way. From humble beginnings to industry leader, discover our story of growth and success.",
    authors: [{ name: "Cindy Baker", avatar: TEMP_AVATAR }],
  },
  {
    img: TEMP_IMAGE,
    tag: "Engineering",
    title: "Pioneering sustainable engineering solutions",
    description:
      "Learn about our commitment to sustainability and the innovative engineering solutions we're implementing to create a greener future. Discover the impact of our eco-friendly initiatives.",
    authors: [
      { name: "Agnes Walker", avatar: TEMP_AVATAR },
      { name: "Trevor Henderson", avatar: TEMP_AVATAR },
    ],
  },
  {
    img: TEMP_IMAGE,
    tag: "Product",
    title: "Maximizing efficiency with our latest product updates",
    description:
      "Our recent product updates are designed to help you maximize efficiency and achieve more. Get a detailed overview of the new features and improvements that can elevate your workflow.",
    authors: [{ name: "Travis Howard", avatar: TEMP_AVATAR }],
  },
];

const StyledCard = styled(Card)({
  display: "flex",
  flexDirection: "column",
  padding: 0,
  height: "100%",
  backgroundColor: "#16181d",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
  "&:hover": {
    backgroundColor: "#1d2027",
    cursor: "pointer",
    borderColor: "rgba(255,255,255,0.24)",
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
  padding: 16,
  flexGrow: 1,
  "&:last-child": {
    paddingBottom: 16,
  },
});

const StyledTypography = styled(Typography)({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

function Author({ authors }: { authors: { name: string; avatar: string }[] }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1,
          alignItems: "center",
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

        <Typography variant="caption">
          {authors.map((author) => author.name).join(", ")}
        </Typography>
      </Box>

      <Typography variant="caption">July 14, 2021</Typography>
    </Box>
  );
}

export default function MainContent() {
  const [focusedCardIndex, setFocusedCardIndex] = React.useState<number | null>(
    null
  );

  const handleFocus = (index: number) => {
    setFocusedCardIndex(index);
  };

  const handleBlur = () => {
    setFocusedCardIndex(null);
  };

  const handleClick = () => {
    console.info("You clicked the filter chip.");
  };

  const chipSx = {
    color: "#a7a7a7",
    bgcolor: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 700,
    borderRadius: "999px",

    "&:hover": {
      bgcolor: "rgba(0,255,224,0.08)",
      color: "#00ffe0",
      borderColor: "rgba(0,255,224,0.45)",
    },
  };

  const activeChipSx = {
    ...chipSx,
    color: "#020617",
    bgcolor: "#00ffe0",
    borderColor: "#00ffe0",

    "&:hover": {
      bgcolor: "#32fff0",
      color: "#020617",
      borderColor: "#32fff0",
    },
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box
        sx={{
          textAlign: "center",
          py: { xs: 4, md: 6 },
        }}
      >
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontWeight: 900,
            color: "#ffffff",
            fontSize: { xs: 40, md: 64 },
            letterSpacing: "-0.04em",
          }}
        >
          NEWS
        </Typography>

        <Typography
          sx={{
            color: "#8b949e",
            fontSize: { xs: 15, md: 18 },
            fontWeight: 600,
            maxWidth: 620,
            mx: "auto",
            mb: 2,
          }}
        >
          Stay in the loop with the latest about our products
        </Typography>
      </Box>

      <Box
        sx={{
          display: { xs: "flex", sm: "none" },
          flexDirection: "row",
          gap: 1,
          width: { xs: "100%", md: "fit-content" },
          overflow: "auto",
        }}
      >
        <Search />

        <IconButton size="small" aria-label="RSS feed">
          <RssFeedRoundedIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          width: "100%",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1.2,
            overflowX: "auto",
            py: 0.5,
            flex: 1,
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          <Chip
            onClick={handleClick}
            size="medium"
            label="All categories"
            sx={activeChipSx}
          />

          <Chip
            onClick={handleClick}
            size="medium"
            label="Company"
            sx={chipSx}
          />

          <Chip
            onClick={handleClick}
            size="medium"
            label="Product"
            sx={chipSx}
          />

          <Chip
            onClick={handleClick}
            size="medium"
            label="Design"
            sx={chipSx}
          />

          <Chip
            onClick={handleClick}
            size="medium"
            label="Engineering"
            sx={chipSx}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Search />

          <IconButton
            size="small"
            aria-label="RSS feed"
            sx={{
              color: "#a7a7a7",
              border: "1px solid rgba(255,255,255,0.12)",
              bgcolor: "#111318",
              borderRadius: "10px",
              "&:hover": {
                color: "#00ffe0",
                borderColor: "rgba(0,255,224,0.45)",
                bgcolor: "rgba(0,255,224,0.08)",
              },
            }}
          >
            <RssFeedRoundedIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2} columns={12}>
        <Grid item xs={12} md={6}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(0)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 0 ? "Mui-focused" : ""}
          >
            <CardMedia
              component="img"
              alt={cardData[0].title}
              image={cardData[0].img}
              sx={{
                aspectRatio: "16 / 9",
                objectFit: "cover",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            />

            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[0].tag}
              </Typography>

              <Typography gutterBottom variant="h6" component="div">
                {cardData[0].title}
              </Typography>

              <StyledTypography
                variant="body2"
                gutterBottom
                sx={{ color: "#a7a7a7" }}
              >
                {cardData[0].description}
              </StyledTypography>
            </StyledCardContent>

            <Author authors={cardData[0].authors} />
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(1)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 1 ? "Mui-focused" : ""}
          >
            <CardMedia
              component="img"
              alt={cardData[1].title}
              image={cardData[1].img}
              sx={{
                aspectRatio: "16 / 9",
                objectFit: "cover",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            />

            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[1].tag}
              </Typography>

              <Typography gutterBottom variant="h6" component="div">
                {cardData[1].title}
              </Typography>

              <StyledTypography
                variant="body2"
                gutterBottom
                sx={{ color: "#a7a7a7" }}
              >
                {cardData[1].description}
              </StyledTypography>
            </StyledCardContent>

            <Author authors={cardData[1].authors} />
          </StyledCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(2)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 2 ? "Mui-focused" : ""}
            sx={{ height: "100%" }}
          >
            <CardMedia
              component="img"
              alt={cardData[2].title}
              image={cardData[2].img}
              sx={{
                height: { sm: "auto", md: "50%" },
                aspectRatio: { sm: "16 / 9", md: "16 / 9" },
                objectFit: "cover",
              }}
            />

            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[2].tag}
              </Typography>

              <Typography gutterBottom variant="h6" component="div">
                {cardData[2].title}
              </Typography>

              <StyledTypography
                variant="body2"
                gutterBottom
                sx={{ color: "#a7a7a7" }}
              >
                {cardData[2].description}
              </StyledTypography>
            </StyledCardContent>

            <Author authors={cardData[2].authors} />
          </StyledCard>
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
            <StyledCard
              variant="outlined"
              onFocus={() => handleFocus(3)}
              onBlur={handleBlur}
              tabIndex={0}
              className={focusedCardIndex === 3 ? "Mui-focused" : ""}
              sx={{ height: "100%" }}
            >
              <StyledCardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <div>
                  <Typography gutterBottom variant="caption" component="div">
                    {cardData[3].tag}
                  </Typography>

                  <Typography gutterBottom variant="h6" component="div">
                    {cardData[3].title}
                  </Typography>

                  <StyledTypography
                    variant="body2"
                    gutterBottom
                    sx={{ color: "#a7a7a7" }}
                  >
                    {cardData[3].description}
                  </StyledTypography>
                </div>
              </StyledCardContent>

              <Author authors={cardData[3].authors} />
            </StyledCard>

            <StyledCard
              variant="outlined"
              onFocus={() => handleFocus(4)}
              onBlur={handleBlur}
              tabIndex={0}
              className={focusedCardIndex === 4 ? "Mui-focused" : ""}
              sx={{ height: "100%" }}
            >
              <StyledCardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                }}
              >
                <div>
                  <Typography gutterBottom variant="caption" component="div">
                    {cardData[4].tag}
                  </Typography>

                  <Typography gutterBottom variant="h6" component="div">
                    {cardData[4].title}
                  </Typography>

                  <StyledTypography
                    variant="body2"
                    gutterBottom
                    sx={{ color: "#a7a7a7" }}
                  >
                    {cardData[4].description}
                  </StyledTypography>
                </div>
              </StyledCardContent>

              <Author authors={cardData[4].authors} />
            </StyledCard>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <StyledCard
            variant="outlined"
            onFocus={() => handleFocus(5)}
            onBlur={handleBlur}
            tabIndex={0}
            className={focusedCardIndex === 5 ? "Mui-focused" : ""}
            sx={{ height: "100%" }}
          >
            <CardMedia
              component="img"
              alt={cardData[5].title}
              image={cardData[5].img}
              sx={{
                height: { sm: "auto", md: "50%" },
                aspectRatio: { sm: "16 / 9", md: "16 / 9" },
                objectFit: "cover",
              }}
            />

            <StyledCardContent>
              <Typography gutterBottom variant="caption" component="div">
                {cardData[5].tag}
              </Typography>

              <Typography gutterBottom variant="h6" component="div">
                {cardData[5].title}
              </Typography>

              <StyledTypography
                variant="body2"
                gutterBottom
                sx={{ color: "#a7a7a7" }}
              >
                {cardData[5].description}
              </StyledTypography>
            </StyledCardContent>

            <Author authors={cardData[5].authors} />
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}
