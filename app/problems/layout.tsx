import AccountBar from "../account-bar";

export default function ProblemsLayout({
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
