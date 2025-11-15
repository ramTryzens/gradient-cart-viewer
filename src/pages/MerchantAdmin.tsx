import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import MerchantsTab from "@/components/merchant-admin/MerchantsTab";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

const MerchantAdmin = () => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();

  // Redirect to home if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/");
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if user is not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-4 md:p-8 flex flex-col">
      <div className="w-full max-w-[1280px] mx-auto flex-grow flex flex-col">
        {/* Logo */}
        <Logo />

        {/* Header */}
        <div className="flex justify-end items-center gap-3 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
          <div className="relative bg-background/60 backdrop-blur-xl rounded-full p-1 border border-white/20 shadow-lg leading-[0]">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl",
                  userButtonPopoverActionButton: "hover:bg-gray-100 text-gray-900 transition-colors",
                  userButtonPopoverActionButtonText: "text-gray-900 font-medium",
                  userButtonPopoverActionButtonIcon: "text-primary",
                  userButtonPopoverFooter: "hidden",
                  userPreviewMainIdentifier: "text-gray-900 font-semibold",
                  userPreviewSecondaryIdentifier: "text-gray-600",
                },
              }}
            />
          </div>
        </div>

        {/* Store Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden mb-auto"
        >
          <div className="p-6">
            <MerchantsTab />
          </div>
        </motion.div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default MerchantAdmin;
