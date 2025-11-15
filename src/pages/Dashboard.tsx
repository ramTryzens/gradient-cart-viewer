import { useUser, UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ShoppingCart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncAndCheckUser = async () => {
      if (!isLoaded || !user) return;

      try {
        setLoading(true);

        // Sync user with backend
        console.log('Syncing user with backend...', {
          clerkUserId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
        });

        const syncResponse = await fetch('http://localhost:3001/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerkUserId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          }),
        });

        if (!syncResponse.ok) {
          const errorData = await syncResponse.json().catch(() => ({}));
          console.error('Sync failed:', errorData);
          throw new Error(errorData.error || 'Failed to sync user with database');
        }

        console.log('User synced successfully');

        // Get user data
        const getUserResponse = await fetch(`http://localhost:3001/api/users/${user.id}`);

        if (!getUserResponse.ok) {
          throw new Error('Failed to get user data');
        }

        const dbUser = await getUserResponse.json();
        setUserData(dbUser);

        // Route based on user status
        if (dbUser.isAdmin) {
          navigate('/admin');
        } else if (dbUser.isApproved) {
          navigate('/merchant-admin');
        } else {
          // User is not approved yet
          setError('Your account is pending approval. Please wait for admin approval.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    syncAndCheckUser();
  }, [user, isLoaded, navigate]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground text-lg">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
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
          </div>

          {/* Pending Approval Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center mb-auto"
          >
            <div className="w-full max-w-2xl">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-yellow-500/20 backdrop-blur-md rounded-full p-4 border border-yellow-500/30">
                    <Clock className="w-12 h-12 text-yellow-400" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    Account Pending Approval
                  </h2>
                  <p className="text-muted-foreground mb-2 text-lg">
                    {error}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    You will receive an email once your account has been approved by an administrator.
                  </p>
                </div>

                {userData && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Your Account Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-medium text-foreground">
                          {userData.firstName} {userData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-sm text-muted-foreground">Email</span>
                        <span className="text-sm font-medium text-foreground">{userData.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-medium border border-yellow-500/30">
                          <Clock className="w-3 h-3" />
                          Pending Approval
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Registered</span>
                        <span className="text-sm font-medium text-foreground">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
