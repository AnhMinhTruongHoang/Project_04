import AppHeader from "@/components/header/app.header";

export default function EMagazineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />

      {children}
    </>
  );
}
