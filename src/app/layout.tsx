import './globals.css';

export const metadata = {
  title: 'The Golden Fork | Restaurant Menu',
  description: 'Discover delicious dishes at The Golden Fork. Browse our menu, get AI recommendations, and order online.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
