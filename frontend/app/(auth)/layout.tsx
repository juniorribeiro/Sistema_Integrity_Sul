export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Integrity Sul</h1>
          <p className="text-sm text-muted-foreground">Consultoria de RH & Bem-estar</p>
        </div>
        {children}
      </div>
    </div>
  );
}
