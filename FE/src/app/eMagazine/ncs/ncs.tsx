import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

const DEFAULT_IMG = "/images/user/NCS.jpg";

const IMG = {
  HERO: DEFAULT_IMG,
  IMG_01: DEFAULT_IMG,
  IMG_02: DEFAULT_IMG,
  IMG_03: DEFAULT_IMG,
  IMG_04: DEFAULT_IMG,
  IMG_05_LEFT: DEFAULT_IMG,
  IMG_05_RIGHT: DEFAULT_IMG,
  IMG_06: DEFAULT_IMG,
  IMG_07: DEFAULT_IMG,
};

type ImgKey = keyof typeof IMG;

function ImageBlock({
  hash,
  caption,
  wide = false,
  height = 520,
}: {
  hash: ImgKey;
  caption?: string;
  wide?: boolean;
  height?: number | { xs: number; md: number };
}) {
  return (
    <Box
      sx={{
        width: "100%",
        my: { xs: 5, md: 7 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height,
          overflow: "hidden",
          bgcolor: "#111",
        }}
      >
        <Box
          component="img"
          src={IMG[hash]}
          alt={hash}
          sx={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            left: { xs: 12, md: 18 },
            bottom: { xs: 12, md: 18 },
            px: 1.3,
            py: 0.6,
            bgcolor: "rgba(0,0,0,0.72)",
            color: "#00ffe0",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.08em",
            border: "1px solid rgba(0,255,224,0.35)",
          }}
        >
          #{hash}
        </Box>
      </Box>

      {caption && (
        <Typography
          sx={{
            mt: 1.2,
            color: "#777",
            fontSize: 13,
            fontStyle: "italic",
            textAlign: wide ? "center" : "left",
          }}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        color: "#1f2933",
        fontSize: { xs: 18, md: 20 },
        lineHeight: { xs: "34px", md: "38px" },
        fontWeight: 500,
        mb: 3,
        textAlign: "justify",
      }}
    >
      {children}
    </Typography>
  );
}

function DropCapParagraph({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="p"
      sx={{
        color: "#1f2933",
        fontSize: { xs: 19, md: 22 },
        lineHeight: { xs: "36px", md: "42px" },
        fontWeight: 500,
        mb: 3,
        textAlign: "justify",

        "&::first-letter": {
          float: "left",
          fontSize: { xs: 72, md: 96 },
          lineHeight: "72px",
          fontWeight: 900,
          color: "#111",
          pr: 1.2,
        },
      }}
    >
      {children}
    </Typography>
  );
}

function ArticleContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: 860,
        mx: "auto",
        px: { xs: 2.2, md: 0 },
      }}
    >
      {children}
    </Container>
  );
}

export default function NcsMagazine() {
  return (
    <Box
      sx={{
        bgcolor: "#f5f1e8",
        minHeight: "100vh",
        color: "#111",
      }}
    >
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: 680, md: 820 },
          overflow: "hidden",
          bgcolor: "#050505",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <Box
          component="img"
          src={IMG.HERO}
          alt="NCS Hero"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.92,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.88) 100%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            left: { xs: 16, md: 28 },
            top: { xs: 88, md: 110 },
            px: 1.4,
            py: 0.7,
            bgcolor: "rgba(0,0,0,0.72)",
            color: "#00ffe0",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.1em",
            border: "1px solid rgba(0,255,224,0.35)",
          }}
        >
          #HERO
        </Box>

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            pb: { xs: 8, md: 12 },
          }}
        >
          <Typography
            sx={{
              color: "#00ffe0",
              fontSize: { xs: 13, md: 15 },
              fontWeight: 900,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              mb: 2,
            }}
          >
            eMagazine
          </Typography>

          <Typography
            component="h1"
            sx={{
              maxWidth: 980,
              color: "#ffffff",
              fontSize: { xs: 46, sm: 68, md: 92 },
              lineHeight: { xs: "54px", sm: "76px", md: "98px" },
              fontWeight: 950,
              letterSpacing: "-0.075em",
              textShadow: "0 24px 80px rgba(0,0,0,0.85)",
            }}
          >
            NCS và hành trình đưa âm nhạc điện tử đến cộng đồng sáng tạo
          </Typography>

          <Typography
            sx={{
              mt: 3,
              maxWidth: 760,
              color: "#d1d5db",
              fontSize: { xs: 18, md: 23 },
              lineHeight: { xs: "30px", md: "38px" },
              fontWeight: 600,
            }}
          >
            Một layout eMagazine mô phỏng phong cách báo dài: ảnh lớn, text rộng
            vừa phải, hình ảnh xen kẽ theo nhịp kể chuyện.
          </Typography>

          <Stack
            direction="row"
            spacing={1.4}
            sx={{
              mt: 4,
              flexWrap: "wrap",
              rowGap: 1,
            }}
          >
            {["Music", "NCS", "Electronic", "Creator Culture"].map((item) => (
              <Box
                key={item}
                sx={{
                  px: 1.6,
                  py: 0.7,
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.24)",
                  bgcolor: "rgba(0,0,0,0.35)",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {item}
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* META */}
      <ArticleContainer>
        <Box
          sx={{
            py: { xs: 4, md: 5 },
            borderBottom: "1px solid rgba(0,0,0,0.16)",
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              color: "#111",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Thực hiện: Minh
          </Typography>

          <Typography
            sx={{
              color: "#555",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            12 phút đọc • 2026
          </Typography>
        </Box>
      </ArticleContainer>

      {/* INTRO */}
      <ArticleContainer>
        <Box sx={{ pt: { xs: 5, md: 8 } }}>
          <DropCapParagraph>
            NCS không chỉ là một kênh nhạc điện tử quen thuộc với cộng đồng sáng
            tạo nội dung. Với nhiều người, đó còn là nơi bắt đầu của những video
            đầu tiên, những bản edit đầu tiên và cả cảm giác tự do khi âm nhạc
            có thể được chia sẻ rộng rãi.
          </DropCapParagraph>

          <Paragraph>
            Từ những bản nhạc mạnh mẽ, giai điệu bắt tai đến phong cách hình ảnh
            nhận diện rõ ràng, NCS tạo ra một thế giới mà âm thanh, màu sắc và
            chuyển động đi cùng nhau. Đó là lý do một bài eMagazine về NCS nên
            được xây bằng những mảng hình ảnh lớn, nhịp đọc nhanh và cảm giác
            hiện đại.
          </Paragraph>
        </Box>
      </ArticleContainer>

      {/* IMAGE 01 */}
      <ArticleContainer>
        <ImageBlock
          hash="IMG_01"
          height={{ xs: 320, md: 540 }}
          caption="#IMG_01 — ảnh mở đầu sau phần lead, gợi ý 1180x660 khi export từ Figma."
        />
      </ArticleContainer>

      {/* BODY 01 */}
      <ArticleContainer>
        <Paragraph>
          Điểm đặc biệt của NCS nằm ở khả năng tạo cảm giác “ngay lập tức”. Chỉ
          cần vài giây đầu, người nghe đã có thể nhận ra tinh thần năng lượng,
          tốc độ và sự bùng nổ thường thấy trong các track electronic.
        </Paragraph>

        <Paragraph>
          Với creator, điều này cực kỳ quan trọng. Một đoạn intro tốt giúp video
          cuốn hơn. Một đoạn drop đúng lúc giúp montage có lực hơn. Một nền nhạc
          phù hợp có thể biến một sản phẩm nhỏ thành một trải nghiệm đáng nhớ.
        </Paragraph>
      </ArticleContainer>

      {/* IMAGE 02 */}
      <Box sx={{ my: { xs: 5, md: 8 } }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: 520, md: 760 },
            overflow: "hidden",
            bgcolor: "#080808",
          }}
        >
          <Box
            component="img"
            src={IMG.IMG_02}
            alt="IMG_02"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.2) 52%, rgba(0,0,0,0.78) 100%)",
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
            <Box sx={{ maxWidth: 680 }}>
              <Typography
                sx={{
                  color: "#00ffe0",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  mb: 2,
                }}
              >
                #IMG_02
              </Typography>

              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: { xs: 34, md: 58 },
                  lineHeight: { xs: "44px", md: "68px" },
                  fontWeight: 950,
                  letterSpacing: "-0.06em",
                }}
              >
                Khi âm thanh trở thành màu sắc của một thế hệ creator
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* BODY 02 */}
      <ArticleContainer>
        <Paragraph>
          Nếu nhìn NCS như một thương hiệu thị giác, có thể thấy mọi thứ đều rất
          rõ: nền tối, màu neon, chuyển động mạnh và cảm giác tương lai. Những
          yếu tố này rất hợp với giao diện dark mode của một music app.
        </Paragraph>

        <Paragraph>
          Đó cũng là lý do layout này dùng nhiều khoảng đen, nhiều vùng ảnh rộng
          và các nhãn ảnh dạng hash. Khi bạn hoàn thiện hình bên Figma, chỉ cần
          thay đường dẫn trong object <strong>IMG</strong>, toàn bộ bài sẽ đổi
          visual mà không cần sửa layout.
        </Paragraph>
      </ArticleContainer>

      {/* IMAGE 03 */}
      <ArticleContainer>
        <ImageBlock
          hash="IMG_03"
          height={{ xs: 340, md: 560 }}
          caption="#IMG_03 — ảnh minh họa phần giữa bài."
        />
      </ArticleContainer>

      {/* QUOTE */}
      <ArticleContainer>
        <Box
          sx={{
            my: { xs: 5, md: 8 },
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 6 },
            bgcolor: "#111",
            color: "#fff",
            borderLeft: "8px solid #00ffe0",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 28, md: 42 },
              lineHeight: { xs: "40px", md: "56px" },
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            “Một bản nhạc đúng khoảnh khắc có thể làm hình ảnh trở nên sống động
            hơn gấp nhiều lần.”
          </Typography>

          <Typography
            sx={{
              mt: 2,
              color: "#9ca3af",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            NCS Magazine Note
          </Typography>
        </Box>
      </ArticleContainer>

      {/* IMAGE 04 */}
      <ArticleContainer>
        <ImageBlock
          hash="IMG_04"
          height={{ xs: 340, md: 560 }}
          caption="#IMG_04 — ảnh nhấn trước phần 2 ảnh song song."
        />
      </ArticleContainer>

      {/* BODY 03 */}
      <ArticleContainer>
        <Paragraph>
          Trong một bài dài, ảnh không chỉ để minh họa. Ảnh là nhịp nghỉ, là
          đoạn chuyển cảnh, là cách giữ người đọc ở lại. Cứ sau một vài đoạn
          chữ, một visual lớn sẽ kéo cảm xúc quay trở lại.
        </Paragraph>

        <Paragraph>
          Với NCS, bạn có thể thiết kế ảnh theo hướng: waveform, visualizer, sân
          khấu ánh sáng, typography lớn, hoặc các khối màu neon đặc trưng. Không
          cần quá nhiều chi tiết, chỉ cần nhất quán.
        </Paragraph>
      </ArticleContainer>

      {/* DOUBLE IMAGE */}
      <ArticleContainer>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 2, md: 3 },
            my: { xs: 5, md: 7 },
          }}
        >
          <Box
            sx={{
              position: "relative",
              height: { xs: 420, md: 620 },
              overflow: "hidden",
              bgcolor: "#111",
            }}
          >
            <Box
              component="img"
              src={IMG.IMG_05_LEFT}
              alt="IMG_05_LEFT"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                left: 14,
                bottom: 14,
                px: 1.2,
                py: 0.6,
                bgcolor: "rgba(0,0,0,0.72)",
                color: "#00ffe0",
                fontSize: 12,
                fontWeight: 900,
                border: "1px solid rgba(0,255,224,0.35)",
              }}
            >
              #IMG_05_LEFT
            </Box>
          </Box>

          <Box
            sx={{
              position: "relative",
              height: { xs: 420, md: 620 },
              overflow: "hidden",
              bgcolor: "#111",
            }}
          >
            <Box
              component="img"
              src={IMG.IMG_05_RIGHT}
              alt="IMG_05_RIGHT"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                left: 14,
                bottom: 14,
                px: 1.2,
                py: 0.6,
                bgcolor: "rgba(0,0,0,0.72)",
                color: "#00ffe0",
                fontSize: 12,
                fontWeight: 900,
                border: "1px solid rgba(0,255,224,0.35)",
              }}
            >
              #IMG_05_RIGHT
            </Box>
          </Box>
        </Box>

        <Typography
          sx={{
            mt: -3,
            mb: 5,
            color: "#777",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          #IMG_05_LEFT và #IMG_05_RIGHT — block 2 ảnh song song giống nhịp
          eMagazine cuối bài.
        </Typography>
      </ArticleContainer>

      {/* IMAGE 06 */}
      <ArticleContainer>
        <ImageBlock
          hash="IMG_06"
          height={{ xs: 340, md: 560 }}
          caption="#IMG_06 — ảnh kết trước đoạn closing."
        />
      </ArticleContainer>

      {/* FINAL */}
      <ArticleContainer>
        <Paragraph>
          NCS có thể được nhìn như một thư viện âm thanh, nhưng với rất nhiều
          người làm nội dung, nó còn là ký ức của những lần đầu tiên tự dựng một
          video, tự chọn một bản nhạc và tự kể câu chuyện của mình bằng hình
          ảnh.
        </Paragraph>

        <Paragraph>
          Chính sự mở đó khiến NCS vượt khỏi phạm vi một kênh nhạc. Nó trở thành
          một phần của văn hóa sáng tạo số, nơi âm nhạc không chỉ để nghe mà còn
          để dựng, để chia sẻ và để truyền cảm hứng.
        </Paragraph>
      </ArticleContainer>

      {/* IMAGE 07 */}
      <ArticleContainer>
        <ImageBlock
          hash="IMG_07"
          height={{ xs: 340, md: 560 }}
          caption="#IMG_07 — ảnh cuối bài."
        />
      </ArticleContainer>

      {/* CREDIT */}
      <ArticleContainer>
        <Box
          sx={{
            py: { xs: 5, md: 7 },
            borderTop: "1px solid rgba(0,0,0,0.18)",
            borderBottom: "1px solid rgba(0,0,0,0.18)",
          }}
        >
          <Typography
            sx={{
              color: "#111",
              fontSize: 16,
              fontWeight: 900,
              mb: 1,
            }}
          >
            Thực hiện:
          </Typography>

          <Typography
            sx={{
              color: "#111",
              fontSize: { xs: 26, md: 34 },
              lineHeight: { xs: "36px", md: "44px" },
              fontWeight: 950,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            MINH — DESIGN — FRONTEND
          </Typography>
        </Box>
      </ArticleContainer>

      {/* COMMENT MOCK */}
      <ArticleContainer>
        <Box sx={{ py: { xs: 5, md: 7 } }}>
          <Typography
            sx={{
              color: "#111",
              fontSize: 24,
              fontWeight: 900,
              mb: 3,
            }}
          >
            Bình luận (0)
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="Gửi bình luận"
            sx={{
              bgcolor: "#fff",
              "& .MuiOutlinedInput-root": {
                borderRadius: 0,
                fontSize: 16,
              },
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#111",
                color: "#fff",
                borderRadius: 0,
                px: 4,
                fontWeight: 900,
                "&:hover": {
                  bgcolor: "#333",
                },
              }}
            >
              Gửi bình luận
            </Button>
          </Box>
        </Box>
      </ArticleContainer>
    </Box>
  );
}
