/** Sign-in and onboarding: no app chrome, but the same landmark and skip-link target as every page. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="flex-1 outline-none">
      {children}
    </main>
  );
}
