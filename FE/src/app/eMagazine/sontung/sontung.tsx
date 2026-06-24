"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";

const DEFAULT_IMG = "/images/user/NCS.jpg";

const MAGAZINE_IMAGES = {
  "#IMG_HERO": DEFAULT_IMG,
  "#IMG_01_FULL": DEFAULT_IMG,
  "#IMG_02_VERTICAL": DEFAULT_IMG,
  "#IMG_03_WIDE": DEFAULT_IMG,
  "#IMG_04_LEFT": DEFAULT_IMG,
  "#IMG_05_RIGHT": DEFAULT_IMG,
  "#IMG_06_CLOSING": DEFAULT_IMG,
};

type ImageKey = keyof typeof MAGAZINE_IMAGES;

const imageSx = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

function ImageHash({
  id,
  sx,
  rounded = true,
}: {
  id: ImageKey;
  sx?: any;
  rounded?: boolean;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: rounded ? { xs: "22px", md: "32px" } : 0,
        border: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "#111318",
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        ...sx,
      }}
    >
      <Box component="img" src={MAGAZINE_IMAGES[id]} alt={id} sx={imageSx} />

      <Box
        sx={{
          position: "absolute",
          left: 16,
          bottom: 16,
          px: 1.4,
          py: 0.6,
          borderRadius: "999px",
          bgcolor: "rgba(0,0,0,0.72)",
          border: "1px solid rgba(0,255,224,0.35)",
          color: "#00ffe0",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.08em",
        }}
      >
        {id}
      </Box>
    </Box>
  );
}

function TextBlock({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Container
      maxWidth="md"
      sx={{
        my: { xs: 7, md: 11 },
      }}
    >
      {eyebrow && (
        <Typography
          sx={{
            color: "#00ffe0",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            mb: 2,
          }}
        >
          {eyebrow}
        </Typography>
      )}

      {title && (
        <Typography
          component="h2"
          sx={{
            color: "#ffffff",
            fontSize: { xs: 32, md: 46 },
            lineHeight: { xs: "42px", md: "58px" },
            fontWeight: 950,
            letterSpacing: "-0.04em",
            mb: 3,
          }}
        >
          {title}
        </Typography>
      )}

      <Box
        sx={{
          color: "#d8dee9",
          fontSize: { xs: 17, md: 19 },
          lineHeight: { xs: "32px", md: "36px" },
          fontWeight: 500,
          "& p": {
            mb: 3,
          },
          "& strong": {
            color: "#ffffff",
            fontWeight: 900,
          },
          "& span": {
            color: "#00ffe0",
            fontWeight: 900,
          },
        }}
      >
        {children}
      </Box>
    </Container>
  );
}

function QuoteBlock() {
  return (
    <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
      <Box
        sx={{
          position: "relative",
          p: { xs: 4, md: 7 },
          borderRadius: { xs: "26px", md: "36px" },
          bgcolor: "linear-gradient(135deg, #10131A, #071C1D)",
          background:
            "linear-gradient(135deg, rgba(18,22,32,0.98), rgba(4,29,30,0.95))",
          border: "1px solid rgba(0,255,224,0.22)",
          boxShadow: "0 24px 90px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: { xs: 24, md: 40 },
            top: { xs: 32, md: 56 },
            bottom: { xs: 32, md: 56 },
            width: 4,
            borderRadius: "99px",
            bgcolor: "#00ffe0",
          }}
        />

        <Typography
          sx={{
            pl: { xs: 3, md: 5 },
            color: "#ffffff",
            fontSize: { xs: 28, md: 44 },
            lineHeight: { xs: "40px", md: "60px" },
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}
        >
          “Một layout eMagazine nên tạo cảm giác như đang đọc một câu chuyện thị
          giác, không chỉ là một bài viết có ảnh.”
        </Typography>

        <Typography
          sx={{
            pl: { xs: 3, md: 5 },
            mt: 3,
            color: "#8b949e",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          — Magazine note
        </Typography>
      </Box>
    </Container>
  );
}

export default function SonTungMagazine() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#05070A",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: 720, md: 820 },
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
        }}
      >
        <Box
          component="img"
          src={MAGAZINE_IMAGES["#IMG_HERO"]}
          alt="#IMG_HERO"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.72,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(5,7,10,0.15) 0%, rgba(5,7,10,0.45) 45%, #05070A 100%)",
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            pb: { xs: 8, md: 12 },
            pt: { xs: 14, md: 18 },
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
            <Chip
              label="EMAGAZINE"
              sx={{
                color: "#020617",
                bgcolor: "#00ffe0",
                fontWeight: 950,
                letterSpacing: "0.16em",
              }}
            />

            <Chip
              label="#IMG_HERO"
              sx={{
                color: "#00ffe0",
                bgcolor: "rgba(0,0,0,0.58)",
                border: "1px solid rgba(0,255,224,0.35)",
                fontWeight: 900,
              }}
            />
          </Stack>

          <Typography
            component="h1"
            sx={{
              maxWidth: 980,
              fontSize: { xs: 46, sm: 68, md: 92 },
              lineHeight: { xs: "54px", sm: "76px", md: "98px" },
              fontWeight: 950,
              letterSpacing: "-0.07em",
              color: "#ffffff",
              textShadow: "0 18px 70px rgba(0,0,0,0.75)",
            }}
          >
            Sơn Tùng M-TP và câu chuyện tương tư của một chàng trai
          </Typography>

          <Typography
            sx={{
              mt: 3,
              maxWidth: 760,
              color: "#c9d1d9",
              fontSize: { xs: 18, md: 23 },
              lineHeight: { xs: "30px", md: "38px" },
              fontWeight: 600,
            }}
          >
            Một bản thiết kế eMagazine dark mode, nhiều ảnh lớn, nhiều khoảng
            thở, phù hợp để bạn dựng lại bằng Figma rồi thay ảnh vào sau.
          </Typography>

          <Typography
            sx={{
              mt: 4,
              color: "#8b949e",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            By Minh • 12 min read • 2026
          </Typography>
        </Container>
      </Box>

      {/* INTRO */}
      <TextBlock eyebrow="Mở đầu">
        <p>
          Đây là phần lead mở bài. Bạn có thể viết một đoạn ngắn, mạnh, tạo cảm
          giác như người đọc đang bước vào một câu chuyện dài hơi.
        </p>

        <p>
          Layout này ưu tiên <span>ảnh lớn</span>, khoảng trắng, chữ lớn và các
          block nội dung tách lớp rõ ràng. Sau khi làm ảnh bên Figma, bạn chỉ
          cần thay đường dẫn trong object <strong>MAGAZINE_IMAGES</strong>.
        </p>
      </TextBlock>

      {/* IMAGE FULL */}
      <Container maxWidth="lg" sx={{ my: { xs: 7, md: 12 } }}>
        <ImageHash
          id="#IMG_01_FULL"
          sx={{
            height: { xs: 320, sm: 460, md: 660 },
          }}
        />

        <Typography
          sx={{
            mt: 1.5,
            color: "#8b949e",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          #IMG_01_FULL — ảnh ngang đầu bài, kích thước gợi ý 1180 x 660.
        </Typography>
      </Container>

      {/* BODY 01 */}
      <TextBlock eyebrow="Chương 01" title="Khi hình ảnh dẫn dắt câu chuyện">
        <p>
          Một bài eMagazine tốt không chỉ là text dài. Nó cần nhịp: đoạn ngắn,
          ảnh lớn, quote mạnh, rồi lại trở về phần nội dung chính.
        </p>

        <p>
          Bạn có thể dùng section này để kể về bối cảnh, nhân vật, hành trình
          hoặc cảm xúc trung tâm của bài viết. Những từ khóa quan trọng có thể
          highlight bằng màu <span>neon cyan</span>.
        </p>
      </TextBlock>

      <QuoteBlock />

      {/* SPLIT SECTION */}
      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "520px 1fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "center",
          }}
        >
          <ImageHash
            id="#IMG_02_VERTICAL"
            sx={{
              height: { xs: 520, md: 720 },
            }}
          />

          <Box
            sx={{
              p: { xs: 4, md: 5 },
              borderRadius: "32px",
              bgcolor: "#0F1218",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 18px 70px rgba(0,0,0,0.35)",
            }}
          >
            <Typography
              sx={{
                color: "#00ffe0",
                fontSize: 13,
                fontWeight: 950,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              #IMG_02_VERTICAL
            </Typography>

            <Typography
              component="h2"
              sx={{
                color: "#ffffff",
                fontSize: { xs: 32, md: 44 },
                lineHeight: { xs: "42px", md: "56px" },
                fontWeight: 950,
                letterSpacing: "-0.05em",
                mb: 3,
              }}
            >
              Một khoảnh khắc dọc để cân lại bố cục
            </Typography>

            <Typography
              sx={{
                color: "#a7b0c0",
                fontSize: 18,
                lineHeight: "34px",
                fontWeight: 500,
              }}
            >
              Ảnh dọc phù hợp cho chân dung, hậu trường, nhân vật chính hoặc một
              frame cảm xúc. Phần text bên cạnh giúp người đọc không bị ngợp bởi
              chuỗi ảnh ngang liên tục.
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* FULL BLEED */}
      <Box sx={{ my: { xs: 8, md: 13 } }}>
        <Box
          sx={{
            position: "relative",
            height: { xs: 520, md: 760 },
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={MAGAZINE_IMAGES["#IMG_03_WIDE"]}
            alt="#IMG_03_WIDE"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.78,
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, #05070A 0%, rgba(5,7,10,0.3) 50%, #05070A 100%)",
            }}
          />

          <Container
            maxWidth="lg"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              left: "50%",
              transform: "translateX(-50%)",
              pb: { xs: 5, md: 8 },
            }}
          >
            <Box>
              <Chip
                label="#IMG_03_WIDE"
                sx={{
                  color: "#00ffe0",
                  bgcolor: "rgba(0,0,0,0.6)",
                  border: "1px solid rgba(0,255,224,0.35)",
                  fontWeight: 900,
                  mb: 2,
                }}
              />

              <Typography
                sx={{
                  maxWidth: 720,
                  color: "#ffffff",
                  fontSize: { xs: 34, md: 56 },
                  lineHeight: { xs: "44px", md: "66px" },
                  fontWeight: 950,
                  letterSpacing: "-0.06em",
                }}
              >
                Full bleed image tạo cảm giác cinematic cho cả bài viết
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* BODY 02 */}
      <TextBlock eyebrow="Chương 02" title="Nhịp đọc, khoảng thở và cảm xúc">
        <p>
          Đoạn này dùng để triển khai phần nội dung sâu hơn. Bạn có thể kể về
          một giai đoạn, một sản phẩm, một album, một nhân vật hoặc một câu
          chuyện phía sau.
        </p>

        <p>
          Với dark mode, nền nên đủ tối, nhưng text phải có độ tương phản cao.
          Card nên dùng <strong>#0F1218</strong>, border mờ và accent màu{" "}
          <span>#00FFE0</span>.
        </p>

        <p>
          Khi code thành page thật, chỉ cần tách các block này thành component:
          Hero, TextBlock, ImageBlock, QuoteBlock, SplitBlock, DoubleImageBlock.
        </p>
      </TextBlock>

      {/* DOUBLE IMAGE */}
      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 4 },
          }}
        >
          <ImageHash
            id="#IMG_04_LEFT"
            sx={{
              height: { xs: 520, md: 680 },
            }}
          />

          <ImageHash
            id="#IMG_05_RIGHT"
            sx={{
              height: { xs: 520, md: 680 },
            }}
          />
        </Box>

        <Typography
          sx={{
            mt: 1.5,
            color: "#8b949e",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          #IMG_04_LEFT và #IMG_05_RIGHT — block 2 ảnh song song, gợi ý 570 x 680
          mỗi ảnh.
        </Typography>
      </Container>

      {/* CLOSING */}
      <Container maxWidth="lg" sx={{ my: { xs: 8, md: 12 } }}>
        <ImageHash
          id="#IMG_06_CLOSING"
          sx={{
            height: { xs: 340, sm: 480, md: 620 },
          }}
        />
      </Container>

      <TextBlock eyebrow="Kết">
        <p>
          Đây là phần kết bài. Viết ngắn, cảm xúc, gọn. Có thể dùng để tổng kết
          tinh thần của nhân vật, sản phẩm hoặc câu chuyện chính.
        </p>
      </TextBlock>

      {/* CREDIT */}
      <Container maxWidth="md" sx={{ pb: { xs: 8, md: 12 } }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", mb: 4 }} />

        <Stack spacing={1.2}>
          <Typography
            sx={{
              color: "#8b949e",
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Thực hiện
          </Typography>

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: 950,
            }}
          >
            Minh • Design • Frontend
          </Typography>

          <Typography
            sx={{
              color: "#8b949e",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Image placeholders: #IMG_HERO, #IMG_01_FULL, #IMG_02_VERTICAL,
            #IMG_03_WIDE, #IMG_04_LEFT, #IMG_05_RIGHT, #IMG_06_CLOSING.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
