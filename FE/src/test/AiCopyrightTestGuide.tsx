"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Typography,
} from "@mui/material";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const codeBoxStyle = {
  px: 1.5,
  py: 1.2,
  color: "#d8d8d8",
  fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.65,
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  borderRadius: 2,
  backgroundColor: "#0d0f10",
  border: "1px solid rgba(255,255,255,0.08)",
};

const sectionTitleStyle = {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 900,
  mb: 1,
};

const descriptionStyle = {
  color: "#a9a9a9",
  fontSize: 13,
  lineHeight: 1.7,
};

const AiCopyrightTestGuide = () => {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        mb: 2,
        color: "#ffffff",
        overflow: "hidden",
        borderRadius: "14px !important",
        backgroundColor: "#111314",
        border: "1px solid rgba(167,139,250,0.24)",

        "&::before": {
          display: "none",
        },

        "&.Mui-expanded": {
          margin: "0 0 16px",
        },
      }}
    >
      {/* GUIDE HEADER */}
      <AccordionSummary
        expandIcon={
          <ExpandMoreRoundedIcon
            sx={{
              color: "#c4b5fd",
            }}
          />
        }
        sx={{
          minHeight: 64,
          px: {
            xs: 1.5,
            sm: 2,
          },
          background:
            "linear-gradient(90deg, rgba(124,58,237,0.14), rgba(17,19,20,0))",

          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 1.4,
            minWidth: 0,
          },

          "& .MuiAccordionSummary-content.Mui-expanded": {
            my: 1.5,
          },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRadius: 2,
            color: "#c4b5fd",
            backgroundColor: "rgba(167,139,250,0.14)",
            border: "1px solid rgba(167,139,250,0.25)",
          }}
        >
          <SmartToyRoundedIcon />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: {
                xs: 14,
                sm: 15,
              },
              fontWeight: 900,
            }}
          >
            AI Copyright Flow & Test Guide
          </Typography>

          <Typography
            sx={{
              color: "#8f8f8f",
              fontSize: 12,
              fontWeight: 700,
              mt: 0.3,
            }}
          >
            Giải thích quy trình và cách kiểm thử nhận diện audio
          </Typography>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          px: {
            xs: 1.5,
            sm: 2.5,
          },
          pb: 2.5,
        }}
      >
        {/* FLOW EXPLANATION */}
        <Box>
          <Typography sx={sectionTitleStyle}>1. Flow hoạt động</Typography>

          <Typography sx={descriptionStyle}>
            Đây là hệ thống kiểm tra rủi ro bản quyền có hỗ trợ thuật toán audio
            fingerprint. Kết quả chỉ hỗ trợ Admin đánh giá, không tự động kết
            luận vi phạm bản quyền.
          </Typography>

          <Box
            component="pre"
            sx={{
              ...codeBoxStyle,
              mt: 1.5,
            }}
          >
            {`Admin bấm nút Robot
→ Frontend gọi POST /copyright-scan
→ Backend tải audio của Track
→ fpcalc tạo Chromaprint fingerprint
→ Lưu fingerprint vào database
→ So sánh với fingerprint của các Track khác
→ Phân loại LOW / MEDIUM / HIGH
→ Cập nhật kết quả vào Track
→ Admin mở popup xem kết quả
→ Admin quyết định Approve hoặc Reject`}
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2.5,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* REQUIRED CONFIGURATION */}
        <Box>
          <Typography sx={sectionTitleStyle}>
            2. Điều kiện trước khi test
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 1.2,
            }}
          >
            {[
              {
                title: "fpcalc",
                value: "Version 1.6.1 đã chạy thành công",
              },
              {
                title: "Backend",
                value: "Chạy trên máy Windows local",
              },
              {
                title: "Authentication",
                value: "Đăng nhập bằng tài khoản ADMIN",
              },
              {
                title: "Audio URL",
                value: "Track phải có URL audio truy cập được",
              },
            ].map((item) => (
              <Box
                key={item.title}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#17191a",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Typography
                  sx={{
                    color: "#c4b5fd",
                    fontSize: 11,
                    fontWeight: 900,
                    mb: 0.4,
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  sx={{
                    color: "#d4d4d4",
                    fontSize: 12,
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            component="pre"
            sx={{
              ...codeBoxStyle,
              mt: 1.5,
            }}
          >
            {`copyright.chromaprint.fpcalc-path=C:/Tools/chromaprint/fpcalc.exe`}
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2.5,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* TEST LOW RISK */}
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography sx={{ ...sectionTitleStyle, mb: 0 }}>
              3. Test hai bài hát khác nhau
            </Typography>

            <Chip
              size="small"
              label="LOW / CLEAN"
              icon={<CheckCircleRoundedIcon />}
              sx={{
                color: "#63e6a6",
                fontWeight: 900,
                backgroundColor: "rgba(99,230,166,0.1)",
                border: "1px solid rgba(99,230,166,0.25)",

                "& .MuiChip-icon": {
                  color: "#63e6a6",
                },
              }}
            />
          </Box>

          <Typography sx={descriptionStyle}>
            Quét hai Track có nội dung hoàn toàn khác nhau. Track đầu tiên được
            lưu vào catalog, Track thứ hai được đem so sánh với catalog đó.
          </Typography>

          <Box
            component="pre"
            sx={{
              ...codeBoxStyle,
              mt: 1.5,
            }}
          >
            {`Bước 1: Bấm Robot để scan Track A
Bước 2: Bấm Robot để scan Track B
Bước 3: Mở popup kết quả Track B

Kết quả mong đợi:
copyrightStatus = CLEAN
riskLevel = LOW
copyrightScore = 0
matchedTrackId = null
matchedTrackTitle = null`}
          </Box>

          <Typography
            sx={{
              ...descriptionStyle,
              mt: 1.2,
              color: "#ffbd69",
            }}
          >
            Fingerprint similarity khoảng 50% có thể là mức giống nhau ngẫu
            nhiên giữa các bit, không đồng nghĩa hai bài hát giống nhau.
          </Typography>
        </Box>

        <Divider
          sx={{
            my: 2.5,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* TEST HIGH RISK */}
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography sx={{ ...sectionTitleStyle, mb: 0 }}>
              4. Test bản sao đã đổi bitrate
            </Typography>

            <Chip
              size="small"
              label="HIGH / MATCHED"
              icon={<WarningAmberRoundedIcon />}
              sx={{
                color: "#ff6b72",
                fontWeight: 900,
                backgroundColor: "rgba(255,107,114,0.1)",
                border: "1px solid rgba(255,107,114,0.25)",

                "& .MuiChip-icon": {
                  color: "#ff6b72",
                },
              }}
            />
          </Box>

          <Typography sx={descriptionStyle}>
            Đây là bài test quan trọng nhất. Cần tạo một file audio mới từ chính
            Track gốc để SHA-256 thay đổi nhưng nội dung âm thanh vẫn giống
            nhau.
          </Typography>

          <Box
            component="pre"
            sx={{
              ...codeBoxStyle,
              mt: 1.5,
            }}
          >
            {`ffmpeg -i "C:\\Music\\original.mp3" -b:a 128k "C:\\Music\\reencoded.mp3"`}
          </Box>

          <Box
            component="pre"
            sx={{
              ...codeBoxStyle,
              mt: 1.2,
            }}
          >
            {`Bước 1: Upload original.mp3 thành Track A
Bước 2: Scan Track A để lưu fingerprint
Bước 3: Re-encode Track A thành reencoded.mp3
Bước 4: Upload reencoded.mp3 thành Track B
Bước 5: Scan Track B
Bước 6: Mở popup kết quả Track B

Kết quả mong đợi:
copyrightStatus = MATCHED
riskLevel = HIGH
matchedTrackId = ID của Track A
matchedTrackTitle = tên Track A
fingerprintScore = điểm similarity cao
matchedDurationRatio = tỷ lệ match cao`}
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2.5,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* POSTMAN TEST */}
        <Box>
          <Typography sx={sectionTitleStyle}>
            5. Test trực tiếp bằng Postman
          </Typography>

          <Box component="pre" sx={codeBoxStyle}>
            {`POST http://localhost:8080/api/v1/admin/tracks/{TRACK_ID}/copyright-scan

Authorization:
Bearer {ADMIN_ACCESS_TOKEN}

Body:
none`}
          </Box>

          <Box
            component="pre"
            sx={{
              ...codeBoxStyle,
              mt: 1.2,
            }}
          >
            {`Response thành công:

statusCode = 200
processingStatus = COMPLETED
copyrightStatus = CLEAN | REVIEW_REQUIRED | MATCHED
riskLevel = LOW | MEDIUM | HIGH`}
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2.5,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* ERROR TEST */}
        <Box>
          <Typography sx={sectionTitleStyle}>
            6. Kiểm tra các trường hợp lỗi
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 1,
            }}
          >
            {[
              {
                code: "403",
                text: "Token không thuộc tài khoản ADMIN",
              },
              {
                code: "404",
                text: "Track không tồn tại hoặc đã bị xóa",
              },
              {
                code: "409",
                text: "Track đang được quét",
              },
              {
                code: "500",
                text: "Sai đường dẫn fpcalc hoặc không tải được audio",
              },
            ].map((item) => (
              <Box
                key={item.code}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.2,
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: "#17191a",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Chip
                  size="small"
                  label={item.code}
                  sx={{
                    minWidth: 52,
                    color: "#ffbd69",
                    fontWeight: 900,
                    backgroundColor: "rgba(255,189,105,0.1)",
                  }}
                />

                <Typography
                  sx={{
                    color: "#bdbdbd",
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider
          sx={{
            my: 2.5,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* FINAL CHECKLIST */}
        <Box
          sx={{
            p: {
              xs: 1.5,
              sm: 2,
            },
            borderRadius: 2.5,
            backgroundColor: "rgba(96,165,250,0.07)",
            border: "1px solid rgba(96,165,250,0.18)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <ScienceRoundedIcon
              sx={{
                color: "#60a5fa",
              }}
            />

            <Typography
              sx={{
                color: "#93c5fd",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              Checklist hoàn thành
            </Typography>
          </Box>

          <Typography sx={descriptionStyle}>
            Flow đạt yêu cầu khi bài khác nhau trả về LOW/CLEAN, bản re-encode
            trả về HIGH/MATCHED, kết quả vẫn tồn tại sau khi reload trang và
            Admin có thể mở popup để xem lại.
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default AiCopyrightTestGuide;
