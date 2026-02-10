import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'rgb(12, 12, 15)' }}>
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
