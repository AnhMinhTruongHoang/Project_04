import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import MainContent from "./components/MainContent";
import BlogFooter from "./components/blogFooter";
import AppHeader from "@/components/header/app.header";
import AppFooter from "@/components/footer/app.footer";

export default function BlogPage() {
  return (
    <>
      <AppHeader />
      <CssBaseline enableColorScheme />

      <Container
        maxWidth="lg"
        component="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          my: 16,
          gap: 4,
        }}
      >
        <MainContent />
        
      </Container>

      <BlogFooter />

      <AppFooter />
    </>
  );
}
