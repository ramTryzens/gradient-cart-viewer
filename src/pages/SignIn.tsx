import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

const SignInPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-bg p-4 md:p-8 flex flex-col">
      <div className="max-w-5xl mx-auto flex-grow flex flex-col w-full">
        {/* Logo */}
        <Logo />

        {/* Header */}
        <div className="flex justify-end mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground text-base"
          >
            ← Back to Home
          </Button>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        >
          <div className="p-10 md:p-16">
            <div className="max-w-lg mx-auto">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent border-0 shadow-none",
                    headerTitle: "text-3xl md:text-4xl font-bold text-foreground mb-3",
                    headerSubtitle: "text-base md:text-lg text-muted-foreground leading-relaxed",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 transition-colors duration-300 h-12 text-base font-medium",
                    footerActionLink: "text-primary hover:text-primary/80 transition-colors text-base",
                    formFieldInput: "bg-white/5 border-white/10 focus:border-primary/50 transition-colors text-foreground text-base h-12 px-4",
                    formFieldLabel: "text-foreground text-base font-medium mb-2",
                    dividerLine: "bg-white/10",
                    dividerText: "text-muted-foreground text-base",
                    socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 transition-colors text-foreground h-12 text-base",
                    socialButtonsBlockButtonText: "text-foreground text-base",
                    identityPreviewText: "text-foreground text-base",
                    identityPreviewEditButton: "text-primary hover:text-primary/80 text-base",
                    formResendCodeLink: "text-primary hover:text-primary/80 text-base",
                    otpCodeFieldInput: "text-foreground text-lg",
                    footerActionText: "text-muted-foreground text-base",
                    formFieldRow: "mb-6",
                    footer: "mt-8",
                    socialButtonsBlockButtonArrow: "text-foreground",
                    badge: "hidden",
                  },
                  layout: {
                    showOptionalFields: false,
                  },
                }}
                routing="virtual"
                signUpUrl="/sign-up"
                redirectUrl="/dashboard"
              />
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8 text-base text-muted-foreground mb-auto"
        >
          Secured with enterprise-grade encryption
        </motion.p>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default SignInPage;
