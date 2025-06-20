import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create | Studio Master",
  description: "Create your masterpiece",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 