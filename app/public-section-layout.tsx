import AccountBar from "./account-bar";

export default function PublicSectionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AccountBar />
      {children}
    </>
  );
}
