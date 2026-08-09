import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-sm rounded-card bg-card-secondary p-8">
        <h1 className="text-2xl text-navy">Log in</h1>
        <p className="mt-1 text-sm text-navy/70">
          Zibeh FYP Repository &amp; Approval System
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-sm text-navy/70">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
