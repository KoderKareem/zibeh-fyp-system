import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-sm rounded-card bg-card p-8">
        <h1 className="text-2xl text-navy">Create an account</h1>
        <p className="mt-1 text-sm text-navy/70">
          For students and supervisors. Admin accounts are created by the
          system administrator.
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-6 text-sm text-navy/70">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
