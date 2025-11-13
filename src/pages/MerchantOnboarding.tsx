import { useUser, UserButton } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Store, Loader2, ShoppingCart } from "lucide-react";
import Logo from "@/components/Logo";

const MerchantOnboarding = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch(`http://localhost:3001/api/users/${user.id}`);

        if (response.ok) {
          const dbUser = await response.json();

          if (!dbUser.isApproved) {
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [user, isLoaded, navigate]);

  const handleContinue = () => {
    navigate('/select-cart');
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg p-4 py-12">
      <div className="w-full max-w-[1280px] mx-auto">
        {/* Logo */}
        <Logo />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-foreground"
          >
            Merchant Onboarding
          </motion.h1>

          {/* Styled User Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full opacity-60 blur-md group-hover:opacity-100 transition-opacity duration-300" />

            {/* Button Container */}
            <div className="relative bg-background/60 backdrop-blur-xl rounded-full p-1 border border-white/20 shadow-lg">
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
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
        >
          <div className="bg-gradient-primary p-6">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-primary-foreground" />
              <div>
                <h2 className="text-2xl font-bold text-primary-foreground">Welcome, Merchant!</h2>
                <p className="text-primary-foreground/80">You're all set to get started</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-foreground text-lg">
                Your account has been approved and you're ready to start using the platform.
              </p>
              <p className="text-muted-foreground">
                Click below to continue to cart selection and begin exploring your options.
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleContinue}
                variant="hero"
                size="lg"
                className="min-w-64"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Continue to Cart Selection
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MerchantOnboarding;
