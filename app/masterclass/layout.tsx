import AccountBar from "../account-bar";

export default function MasterclassLayout({
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
