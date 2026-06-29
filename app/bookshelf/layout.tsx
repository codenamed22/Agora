import PublicSectionLayout from "../public-section-layout";
import SiteFooter from "../site-footer";

export default function BookshelfLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PublicSectionLayout>
      {children}
      <SiteFooter />
    </PublicSectionLayout>
  );
}
