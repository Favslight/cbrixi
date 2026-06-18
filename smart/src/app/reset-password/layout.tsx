import AuthLayout from "../auth/layout";

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
